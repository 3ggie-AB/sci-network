package service

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/gosnmp/gosnmp"
	"github.com/yourorg/netmon/internal/model"
	"github.com/yourorg/netmon/internal/repository"
)

// ExecuteSNMP performs SNMP GET on given OIDs
func ExecuteSNMP(userID string, req model.SNMPRequest) (*model.SNMPResult, error) {
	if req.Port == 0 {
		req.Port = 161
	}
	if req.Community == "" {
		req.Community = "public"
	}
	if req.Timeout == 0 {
		req.Timeout = 5
	}
	if req.Version == "" {
		req.Version = model.SNMPv2c
	}

	version := gosnmp.Version2c
	switch req.Version {
	case model.SNMPv1:
		version = gosnmp.Version1
	case model.SNMPv2c:
		version = gosnmp.Version2c
	}

	g := &gosnmp.GoSNMP{
		Target:    req.Host,
		Port:      req.Port,
		Community: req.Community,
		Version:   version,
		Timeout:   time.Duration(req.Timeout) * time.Second,
		Retries:   2,
	}

	if err := g.Connect(); err != nil {
		return nil, fmt.Errorf("gagal koneksi SNMP ke %s: %v", req.Host, err)
	}
	defer g.Conn.Close()

	start := time.Now()
	result := &model.SNMPResult{
		Host:    req.Host,
		OIDData: make(map[string]string),
	}

	pdu, err := g.Get(req.OIDs)
	elapsed := time.Since(start).Milliseconds()

	if err != nil {
		result.Error = err.Error()
		resultJSON, _ := json.Marshal(result)
		_ = repository.InsertNetworkLog(userID, "snmp", req.Host, string(resultJSON), false, elapsed)
		return result, nil
	}

	for _, variable := range pdu.Variables {
		result.OIDData[variable.Name] = snmpValueToString(variable)
	}

	resultJSON, _ := json.Marshal(result)
	_ = repository.InsertNetworkLog(userID, "snmp", req.Host, string(resultJSON), true, elapsed)

	return result, nil
}

func snmpValueToString(v gosnmp.SnmpPDU) string {
	switch v.Type {
	case gosnmp.OctetString:
		b, ok := v.Value.([]byte)
		if ok {
			return string(b)
		}
	case gosnmp.Integer:
		return fmt.Sprintf("%d", gosnmp.ToBigInt(v.Value))
	case gosnmp.Counter32, gosnmp.Gauge32, gosnmp.TimeTicks:
		return fmt.Sprintf("%d", gosnmp.ToBigInt(v.Value))
	case gosnmp.Counter64:
		return fmt.Sprintf("%d", gosnmp.ToBigInt(v.Value))
	case gosnmp.IPAddress:
		return fmt.Sprintf("%s", v.Value)
	case gosnmp.ObjectIdentifier:
		return fmt.Sprintf("%s", v.Value)
	case gosnmp.Null:
		return "null"
	}
	return fmt.Sprintf("%v", v.Value)
}

// CommonOIDs returns commonly used SNMP OIDs for quick reference
func CommonOIDs() map[string]string {
	return map[string]string{
		"sysDescr":        ".1.3.6.1.2.1.1.1.0",
		"sysObjectID":     ".1.3.6.1.2.1.1.2.0",
		"sysUpTime":       ".1.3.6.1.2.1.1.3.0",
		"sysContact":      ".1.3.6.1.2.1.1.4.0",
		"sysName":         ".1.3.6.1.2.1.1.5.0",
		"sysLocation":     ".1.3.6.1.2.1.1.6.0",
		"ifNumber":        ".1.3.6.1.2.1.2.1.0",
		"ifInOctets":      ".1.3.6.1.2.1.2.2.1.10.1",
		"ifOutOctets":     ".1.3.6.1.2.1.2.2.1.16.1",
		"ifOperStatus":    ".1.3.6.1.2.1.2.2.1.8.1",
		"ipAdEntAddr":     ".1.3.6.1.2.1.4.20.1.1",
		"hrMemorySize":    ".1.3.6.1.2.1.25.2.2.0",
		"hrProcessorLoad": ".1.3.6.1.2.1.25.3.3.1.2.196608",
	}
}
