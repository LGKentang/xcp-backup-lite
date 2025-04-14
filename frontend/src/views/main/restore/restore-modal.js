import React, { useState, useEffect } from 'react';
import {
  CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle,
  CButton, CFormInput, CFormSelect, CFormSwitch
} from '@coreui/react';
import { fetch_validly_connected_host } from '../../../api/host/host_api';
import { fetch_host_sr } from '../../../api/storage/storage_repository_api';
import { fetch_backup_versions_by_backup_id, fetch_backups, fetch_backups_by_host } from '../../../api/backup/backup_api';
import { add_restore } from '../../../api/restore/restore_api';

const RestoreModal = ({ visible, onClose, onSave }) => {
  // --- State ---
  const [latestToggle, setLatestToggle] = useState(true);
  const [hosts, setHosts] = useState([]);
  const [srs, setSrs] = useState([]);
  const [backups, setBackups] = useState([]);
  const [backupVersions, setBackupVersions] = useState([]);

  const [selectedHostIp, setSelectedHostIp] = useState('');
  const [selectedBackupId, setSelectedBackupId] = useState('');
  const [selectedBackupVersion, setSelectedBackupVersion] = useState('');
  const [selectedSr, setSelectedSr] = useState(null);
  const [restoreName, setRestoreName] = useState('');
  const [powerOn, setPowerOn] = useState(true);
  const [preserve, setPreserve] = useState(false);

  // --- Initial Hosts ---
  useEffect(() => {
    (async () => {
      try {
        const hostRes = await fetch_validly_connected_host();
        setHosts(hostRes);
      } catch (err) {
        console.error('Failed to fetch hosts:', err);
      }
    })();
  }, []);

  // --- SRs and Backups for Host ---
  useEffect(() => {
    if (!selectedHostIp) return;
    (async () => {
      try {
        const [srRes, backupRes] = await Promise.all([
          fetch_host_sr(selectedHostIp),
          fetch_backups_by_host(selectedHostIp),
        ]);
        // console.log(backupRes)
        setSrs(srRes);
        setBackups(backupRes);
        setSelectedSr(null);
        setSelectedBackupId('');
        setBackupVersions([]);
      } catch (err) {
        console.error('Failed to fetch SRs or backups:', err);
      }
    })();
  }, [selectedHostIp]);

  // --- Backup Versions ---
  useEffect(() => {
    if (!selectedBackupId) return;
    (async () => {
      try {
        const versions = await fetch_backup_versions_by_backup_id(selectedBackupId);
        console.log(versions)
        setBackupVersions(versions);
      } catch (err) {
        console.error('Failed to fetch backup versions:', err);
      }
    })();
  }, [selectedBackupId, latestToggle]);

  const handleRestore = async () => {
    if (!selectedBackupId) {
      alert('Please select a backup job');
      return;
    }
    if (!selectedHostIp) {
      alert('Please select a Host');
      return;
    }
    if (!selectedSr) {
      alert('Please select a storage repository');
      return;
    }
    if (!backupVersions || backupVersions.length === 0) {
      alert('There is no backup available for this job!')
      return;
    }

    const payload = {
      host_ip: selectedHostIp,
      sr_uuid: selectedSr.uuid,
      backup_id: selectedBackupId,
      preserve: preserve,
      power_on_after_restore: powerOn
    };

    await add_restore(payload)

    onSave(payload);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setLatestToggle(true);
    setSelectedHostIp('');
    setSelectedBackupId('');
    setSelectedBackupVersion('');
    setSelectedSr(null);
    setRestoreName('');
    setPowerOn(true);
    setBackupVersions([]);
  };



  return (
    <CModal visible={visible} onClose={onClose} backdrop="static" size="lg">
      <CModalHeader>
        <CModalTitle>Restore Backup</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {/* Host Select */}
        <div className="mb-3">
          <label>Host</label>
          <CFormSelect value={selectedHostIp} onChange={(e) => setSelectedHostIp(e.target.value)}>
            <option value="">Select a host</option>
            {hosts.map((host) => (
              <option key={host.host_ip} value={host.host_ip}>
                {`${host.name} (${host.host_ip})`}
              </option>
            ))}
          </CFormSelect>
        </div>

        {/* Backup Select */}
        {selectedHostIp && (
          <div className="mb-3">
            <label>Backup</label>
            <CFormSelect
              value={selectedBackupId}
              onChange={(e) => setSelectedBackupId(e.target.value)}
            // disabled={!backups.length}
            >
              <option value="">Select backup</option>
              {backups.map((backup) => (
                <option key={backup.id} value={backup.id}>
                  {`${backup.name} | ${backup.vm_name}`}
                </option>
              ))}
            </CFormSelect>
          </div>
        )}

        {/* Toggle + Version Select
        {selectedBackupId && (
          <>
            {backupVersions.length === 0 ? (
              <div className="mb-3 text-muted fst-italic">
                No backups have been created for this backup job.
              </div>
            ) : (
              <>
                <div className="mb-3 d-flex align-items-center gap-2">
                  <label className="mb-0">Use Latest Backup</label>
                  <CFormSwitch checked={latestToggle} onChange={() => setLatestToggle(!latestToggle)} />
                </div>

                {!latestToggle && (
                  <div className="mb-3">
                    <label>Backup Version</label>
                    <CFormSelect
                      value={selectedBackupVersion}
                      onChange={(e) => setSelectedBackupVersion(e.target.value)}
                    >
                      <option disabled value="">Select version</option>
                      {backupVersions.map((v) => (
                        <option key={v.job_id} value={v.job_id}>
                          {`Backup Job ID : ${v.job_id} | Completed At : ${new Date(v.completed_at).toLocaleString()}`}
                        </option>
                      ))}
                    </CFormSelect>
                  </div>
                )}
              </>
            )}
          </>
        )} */}


        {/* Storage Repository Select */}
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
              <option disabled value="">Select a SR</option>
              {srs.map((sr) => (
                <option key={sr.uuid} value={sr.uuid}>
                  {sr.name}
                </option>
              ))}
            </CFormSelect>
          </div>
        )}

        {/* Optional Restore Name */}
        <div className="mb-3">
          <label>Restore Name (optional)</label>
          <CFormInput
            type="text"
            value={restoreName}
            onChange={(e) => setRestoreName(e.target.value)}
            placeholder="Leave blank to use original VM name"
          />
        </div>

        {/* Power Toggle */}

        <div className="mb-3 d-flex justify-content-between align-items-center">
          <label
            className="mb-0"
            title="Preserve original UUIDs and metadata. Not recommended when restoring to the same pool."
          >
            Preserve <span style={{ color: 'gray' }}>(<strong>Not</strong> recommended for same pool)</span>
          </label>

          <CFormSwitch
            checked={preserve}
            onChange={() => setPreserve(!preserve)}
          />
        </div>

        <div className="mb-3 d-flex justify-content-between align-items-center">
          <label className="mb-0">Power On After Restore</label>
          <CFormSwitch checked={powerOn} onChange={() => setPowerOn(!powerOn)} />
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
