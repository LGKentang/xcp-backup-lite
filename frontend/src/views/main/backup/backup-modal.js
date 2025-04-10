import React, { Fragment, useState, useEffect } from 'react';
import {
    CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle, CButton, CFormSwitch
} from '@coreui/react';
import { ReUnixCron } from '@sbzen/re-cron';
import cronstrue from 'cronstrue';
import { fetch_validly_connected_host } from '../../../api/host/host_api';
import { fetch_host_sr } from '../../../api/storage/storage_repository_api';

const BackupModal = ({ visible, onClose, onSave }) => {
    const [newBackup, setNewBackup] = useState({
        name: '',
        description: '',
        location: '',
        retention: 1,
        status: 'Active',
        schedule: '',
        runOnce: false
    });

    const [cron, setCron] = useState('* * * * *');
    const [isManualInput, setIsManualInput] = useState(false);
    const [hosts, setHosts] = useState([])
    const [sr, setSrs] = useState([[]])
    const [selectedHostIp, setSelectedHostIp] = useState('');


    useEffect(() => {
        setNewBackup(prev => ({ ...prev, schedule: cron }));
    }, [cron]);

    useEffect(() => {
        async function handleFetchHost() {
            try {
                const host = await fetch_validly_connected_host();
                setHosts(host);
            } catch (error) {
                console.error('Failed to fetch hosts:', error);
            }
        }

        handleFetchHost();
    }, []);

    useEffect(() => {
        async function handleFetchHostSr() {
            if (!selectedHostIp) return;

            try {
                const sr = await fetch_host_sr(selectedHostIp);
                setSrs(sr);
            } catch (error) {
                console.error('Failed to fetch SRs for host:', selectedHostIp, error);
            }
        }

        handleFetchHostSr();
    }, [selectedHostIp]);

    const handleSave = () => {
        onSave(newBackup);
        setNewBackup({ name: '', schedule: '', location: '', status: 'Active' });
        setIsManualInput(false);
        onClose();
    };

    let cronHumanReadable = '';
    try {
        cronHumanReadable = cronstrue.toString(cron);
    } catch (err) {
        cronHumanReadable = 'Invalid CRON expression';
    }

    function formatStorage(usedGb, sizeGb) {
        if (typeof usedGb !== 'number' || typeof sizeGb !== 'number') {
            return 'Unknown usage';
        }

        const freeGb = sizeGb - usedGb;

        const format = (gb) => {
            if (typeof gb !== 'number') return 'N/A';
            return gb > 1000
                ? `${(gb / 1024).toFixed(2)} TB`
                : `${gb.toFixed(2)} GB`;
        };

        return `${format(usedGb)} used / ${format(freeGb)} free`;
    }

    const handleCreateBackup = () => {
        if (!newBackup.name.trim()) {
            alert('Name is required.');
            return;
        }
    
        if (!newBackup.description.trim()) {
            alert('Description is required.');
            return;
        }
    
        if (!selectedHostIp) {
            alert('Please select a host.');
            return;
        }
    
        const retention = parseInt(newBackup.retention, 10);
        if (isNaN(retention) || retention < 1) {
            alert('Retention must be a number greater than or equal to 1.');
            return;
        }
    
        try {
            cronstrue.toString(cron);
        } catch (err) {
            alert('Schedule must be a valid CRON expression.');
            return;
        }

        onSave(newBackup);
    
        setNewBackup({
            name: '',
            description: '',
            location: '',
            retention: 0,
            status: 'Active',
            schedule: '',
            runOnce: false
        });
    
        setSelectedHostIp('');
        setIsManualInput(false);
        onClose();
    };
    

    return (
        <CModal visible={visible} onClose={onClose} backdrop="static" size="xl">
            <CModalHeader>
                <CModalTitle>Add New Backup</CModalTitle>
            </CModalHeader>
            <CModalBody>

                <div className="mb-3">
                    <label htmlFor="backupName">Name</label>
                    <input
                        type="text"
                        className="form-control"
                        id="backupName"
                        value={newBackup.name}
                        onChange={(e) => setNewBackup({ ...newBackup, name: e.target.value })}

                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="backupName">Description</label>
                    <input
                        type="text"
                        className="form-control"
                        id="backupName"
                        value={newBackup.description}
                        onChange={(e) => setNewBackup({ ...newBackup, description: e.target.value })}
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="host">Host</label>
                    <select
                        className="form-control"
                        id="host"
                        value={selectedHostIp}
                        onChange={(e) => setSelectedHostIp(e.target.value)}
                    >
                        <option value="" disabled>Select a host</option>
                        {hosts.map((host,index) => (
                            <option key={index} value={host.host_ip}>
                                {`${host.name} (${host.host_ip})`}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-3">
                    <label htmlFor="backupName">Retention (number of full backups)</label>
                    <input
                        type="text"
                        className="form-control"
                        id="backupName"
                        value={newBackup.retention}
                        onChange={(e) => setNewBackup({ ...newBackup, retention: e.target.value })}
                    />
                </div>


                {selectedHostIp && sr.length > 0 && (
                    <div className="mb-3">
                        <label htmlFor="sr">Storage Repository (NFS)</label>
                        <select
                            className="form-control"
                            id="sr"
                            value={newBackup.location}
                            onChange={(e) => setNewBackup({ ...newBackup, location: e.target.value })}
                        >
                            <option value="" disabled>Select a Storage Repository</option>
                            {sr.map((item,index) => (
                                <option key={index} value={item.uuid}>
                                    {item.name} ({formatStorage(item.physical_utilisation_gb, item.physical_size_gb)})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="mb-0">Schedule (WIB)</label>
                        <div className="d-flex align-items-center">
                            <span className="me-2">Manual Input</span>
                            <CFormSwitch
                                checked={!isManualInput}
                                onChange={() => setIsManualInput(prev => !prev)}
                                label="Visual Editor"
                            />
                        </div>
                    </div>


                    <input
                        type="text"
                        className="form-control mb-2"
                        value={cron}
                        onChange={(e) => setCron(e.target.value)}
                        readOnly={!isManualInput}
                    />
                    <p className="text-muted mt-2">{cronHumanReadable}</p>

                    {!isManualInput && (
                        <div className="mb-2">
                            <ReUnixCron value={cron} onChange={setCron} />
                        </div>
                    )}

                </div>

                <div className="form-check mb-3">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        id="status"
                        checked={newBackup.status === "Active"}
                        onChange={(e) =>
                            setNewBackup({ ...newBackup, status: e.target.checked ? "Active" : "Inactive" })
                        }
                    />
                    <label className="form-check-label" htmlFor="status">
                        Active
                    </label>
                </div>

                <div className="form-check mb-3">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        id="runOnceCheckbox"
                        checked={newBackup.runOnce}
                        onChange={(e) => setNewBackup({ ...newBackup, runOnce: e.target.checked })}
                    />

                    <label className="form-check-label" htmlFor="runOnceCheckbox">
                        Run Once
                    </label>
                </div>

            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" onClick={onClose}>Close</CButton>
                <CButton color="primary" onClick={handleSave}>Save Backup</CButton>
            </CModalFooter>
        </CModal>
    );
};

export default BackupModal;
