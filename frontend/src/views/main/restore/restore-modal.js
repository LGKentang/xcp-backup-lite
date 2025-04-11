import React, { useState, useEffect } from 'react';
import {
  CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle,
  CButton, CFormInput, CFormSelect, CFormSwitch
} from '@coreui/react';
import { fetch_validly_connected_host } from '../../../api/host/host_api';
import { fetch_host_sr } from '../../../api/storage/storage_repository_api';
import { fetch_backups } from '../../../api/backup/backup_api';

const RestoreModal = ({ visible, onClose, onRestore }) => {
  const [latestToggle, setLatestToggle] = useState(true);
  const [hosts, setHosts] = useState([]);
  const [srs, setSrs] = useState([]);
  const [backups, setBackups] = useState([]);
  const [selectedBackupId, setSelectedBackupId] = useState('');
  const [selectedHostIp, setSelectedHostIp] = useState('');
  const [selectedSr, setSelectedSr] = useState(null);
  const [restoreName, setRestoreName] = useState('');
  const [powerOn, setPowerOn] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [hostRes, backupRes] = await Promise.all([
          fetch_validly_connected_host(),
          fetch_backups()
        ]);
        setHosts(hostRes);
        setBackups(backupRes);
      } catch (error) {
        console.error('Error initializing restore modal:', error);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedHostIp) return;
    (async () => {
      try {
        const sr = await fetch_host_sr(selectedHostIp);
        setSrs(sr);
      } catch (error) {
        console.error('Failed to fetch SRs:', error);
      }
    })();
  }, [selectedHostIp]);

  const handleRestore = async () => {
    const backup = latestToggle
      ? backups.reduce((latest, curr) =>
          !latest || new Date(curr.created_at) > new Date(latest.created_at)
            ? curr
            : latest, null)
      : backups.find(b => b.backup_id === selectedBackupId);

    if (!backup || !selectedHostIp || !selectedSr) {
      alert('Please complete all required fields.');
      return;
    }

    const payload = {
      backup_id: backup.backup_id,
      host_ip: selectedHostIp,
      sr_uuid: selectedSr.uuid,
      restore_name: restoreName || null,
      power_on: powerOn
    };

    // await restore_backup(payload);
    onRestore(payload);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setLatestToggle(true);
    setSelectedBackupId('');
    setSelectedHostIp('');
    setSelectedSr(null);
    setRestoreName('');
    setPowerOn(true);
  };

  return (
    <CModal visible={true} onClose={onClose} backdrop="static" size="lg">
      <CModalHeader>
        <CModalTitle>Restore Backup</CModalTitle>
      </CModalHeader>
      <CModalBody>

        <div className="mb-3 d-flex justify-content-between align-items-center">
          <label className="mb-0">Use Latest Backup</label>
          <CFormSwitch
            checked={latestToggle}
            onChange={() => setLatestToggle(!latestToggle)}
          />
        </div>

        {!latestToggle && (
          <div className="mb-3">
            <label>Select a Backup</label>
            <CFormSelect
              value={selectedBackupId}
              onChange={(e) => setSelectedBackupId(e.target.value)}
            >
              <option value="">Select backup</option>
              {backups.map((backup) => (
                <option key={backup.backup_id} value={backup.backup_id}>
                  {`${backup.vm_name} — ${new Date(backup.created_at).toLocaleString()}`}
                </option>
              ))}
            </CFormSelect>
          </div>
        )}

        <div className="mb-3">
          <label>Destination Host</label>
          <CFormSelect
            value={selectedHostIp}
            onChange={(e) => setSelectedHostIp(e.target.value)}
          >
            <option value="">Select a host</option>
            {hosts.map((host) => (
              <option key={host.host_ip} value={host.host_ip}>
                {`${host.name} (${host.host_ip})`}
              </option>
            ))}
          </CFormSelect>
        </div>

        {selectedHostIp && (
          <div className="mb-3">
            <label>Storage Repository</label>
            <CFormSelect
              value={selectedSr?.uuid || ''}
              onChange={(e) => {
                const sr = srs.find(sr => sr.uuid === e.target.value);
                if (sr) setSelectedSr(sr);
              }}
            >
              <option value="">Select a SR</option>
              {srs.map((sr) => (
                <option key={sr.uuid} value={sr.uuid}>
                  {sr.name}
                </option>
              ))}
            </CFormSelect>
          </div>
        )}

        <div className="mb-3">
          <label>Restore Name (optional)</label>
          <CFormInput
            type="text"
            value={restoreName}
            onChange={(e) => setRestoreName(e.target.value)}
            placeholder="Leave blank to use original VM name"
          />
        </div>

        <div className="mb-3 d-flex justify-content-between align-items-center">
          <label className="mb-0">Power On After Restore</label>
          <CFormSwitch
            checked={powerOn}
            onChange={() => setPowerOn(!powerOn)}
          />
        </div>

      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>Cancel</CButton>
        <CButton color="primary" onClick={handleRestore}>Restore</CButton>
      </CModalFooter>
    </CModal>
  );
};

export default RestoreModal;
