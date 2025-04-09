import React, { Fragment, useState } from 'react';
import { CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle, CButton } from '@coreui/react';
import { ReQuartzCron } from '@sbzen/re-cron';
import cronstrue from 'cronstrue';  // Import cronstrue to convert cron expressions to human-readable format

const BackupModal = ({ visible, onClose, onSave }) => {
    const [newBackup, setNewBackup] = useState({
        name: '',
        schedule: '',
        location: '',
        status: 'Active'
    });
    const [cron, setCron] = useState('2,0,4,3,1 0/1 3/2 ? * 4/5 *');

    const handleSave = () => {
        onSave(newBackup); // Pass newBackup to parent component
        setNewBackup({ name: '', schedule: '', location: '', status: 'Active' }); // Reset form
        onClose(); // Close the modal
    };

    const cronHumanReadable = cronstrue.toString(cron); // Convert cron expression to human-readable format

    return (
        <CModal
            visible={visible}
            onClose={onClose}
            backdrop="static"
            aria-labelledby="AddBackupModalLabel"
            size='xl'
        >
            <CModalHeader>
                <CModalTitle id="AddBackupModalLabel">Add New Backup</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <div className="mb-3">
                    <label htmlFor="backupName">Backup Name</label>
                    <input
                        type="text"
                        className="form-control"
                        id="backupName"
                        value={newBackup.name}
                        onChange={(e) => setNewBackup({ ...newBackup, name: e.target.value })}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="schedule">Schedule</label>
                    <Fragment>
                        <input
                            className="form-control mb-4"
                            readOnly
                            value={cron}  // Display human-readable cron text
                        />
                        <p>{cronHumanReadable}</p>
                        {/* Cron input to allow the user to update it */}
                        <ReQuartzCron
                            value={cron}
                            onChange={setCron}
                        />
                    </Fragment>

                    <input
                        type="text"
                        className="form-control"
                        id="schedule"
                        value={newBackup.schedule}
                        onChange={(e) => setNewBackup({ ...newBackup, schedule: e.target.value })}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="location">Location</label>
                    <input
                        type="text"
                        className="form-control"
                        id="location"
                        value={newBackup.location}
                        onChange={(e) => setNewBackup({ ...newBackup, location: e.target.value })}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="status">Status</label>
                    <select
                        className="form-control"
                        id="status"
                        value={newBackup.status}
                        onChange={(e) => setNewBackup({ ...newBackup, status: e.target.value })}
                    >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" onClick={onClose}>
                    Close
                </CButton>
                <CButton color="primary" onClick={handleSave}>
                    Save Backup
                </CButton>
            </CModalFooter>
        </CModal>
    );
};

export default BackupModal;
