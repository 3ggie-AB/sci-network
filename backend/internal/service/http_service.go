package service

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/yourorg/netmon/internal/model"
	"github.com/yourorg/netmon/internal/repository"
)

const maxHTTPResponseBodyBytes = 64 * 1024

// ExecuteHTTPGet performs an HTTP GET request for API/server checks.
func ExecuteHTTPGet(userID string, req model.HTTPGetRequest) (*model.HTTPGetResult, error) {
	targetURL, err := normalizeHTTPGetURL(req.URL)
	if err != nil {
		return nil, err
	}

	timeout := time.Duration(normalizeHTTPTimeout(req.Timeout)) * time.Second
	result := &model.HTTPGetResult{
		URL: targetURL.String(),
	}

	httpReq, err := http.NewRequest(http.MethodGet, targetURL.String(), nil)
	if err != nil {
		return nil, err
	}
	for key, value := range req.Headers {
		key = strings.TrimSpace(key)
		if key == "" {
			continue
		}
		httpReq.Header.Set(key, value)
	}
	if httpReq.Header.Get("User-Agent") == "" {
		httpReq.Header.Set("User-Agent", "NetMon/1.0")
	}

	client := &http.Client{Timeout: timeout}
	start := time.Now()
	resp, err := client.Do(httpReq)
	result.Duration = time.Since(start).Milliseconds()
	if err != nil {
		result.Error = err.Error()
		logHTTPGet(userID, result, false)
		return result, nil
	}
	defer resp.Body.Close()

	result.StatusCode = resp.StatusCode
	result.Status = resp.Status
	result.ContentType = resp.Header.Get("Content-Type")
	result.Headers = flattenHTTPHeaders(resp.Header)
	result.IsUp = resp.StatusCode >= http.StatusOK && resp.StatusCode < http.StatusBadRequest

	body, truncated, err := readHTTPBody(resp.Body)
	result.Body = body
	result.BodyTruncated = truncated
	if err != nil {
		result.Error = err.Error()
		logHTTPGet(userID, result, false)
		return result, nil
	}

	logHTTPGet(userID, result, result.IsUp)
	return result, nil
}

func normalizeHTTPGetURL(rawURL string) (*url.URL, error) {
	rawURL = strings.TrimSpace(rawURL)
	if rawURL == "" {
		return nil, fmt.Errorf("URL wajib diisi")
	}
	if !strings.Contains(rawURL, "://") {
		rawURL = "http://" + rawURL
	}

	parsed, err := url.Parse(rawURL)
	if err != nil {
		return nil, fmt.Errorf("URL tidak valid: %v", err)
	}
	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return nil, fmt.Errorf("scheme URL harus http atau https")
	}
	if parsed.Host == "" {
		return nil, fmt.Errorf("host URL wajib diisi")
	}
	return parsed, nil
}

func normalizeHTTPTimeout(timeout int) int {
	if timeout <= 0 {
		return 10
	}
	if timeout > 30 {
		return 30
	}
	return timeout
}

func readHTTPBody(body io.Reader) (string, bool, error) {
	limited := io.LimitReader(body, maxHTTPResponseBodyBytes+1)
	data, err := io.ReadAll(limited)
	if err != nil {
		return "", false, err
	}

	truncated := len(data) > maxHTTPResponseBodyBytes
	if truncated {
		data = data[:maxHTTPResponseBodyBytes]
	}
	return string(data), truncated, nil
}

func flattenHTTPHeaders(headers http.Header) map[string]string {
	result := make(map[string]string, len(headers))
	for key, values := range headers {
		result[key] = strings.Join(values, ", ")
	}
	return result
}

func logHTTPGet(userID string, result *model.HTTPGetResult, success bool) {
	resultJSON, _ := json.Marshal(result)
	_ = repository.InsertNetworkLog(userID, "http", result.URL, string(resultJSON), success, result.Duration)
}
