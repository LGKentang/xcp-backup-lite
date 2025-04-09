import React, { useState } from 'react';
import { CTable, CTableHead, CTableBody, CTableRow, CTableHeaderCell, CTableDataCell, CButton, CBadge, CRow, CCol, CCard, CCardHeader, CCardBody } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilTrash, cilPlus, cilPencil } from '@coreui/icons';
import BackupModal from './backup-modal.js';


const Backup = () => {
    const [backups, setBackups] = useState([
        { id: 1, name: 'Backup 1', schedule: 'Daily', location: '/mnt/backup1', status: 'Active' },
        { id: 2, name: 'Backup 2', schedule: 'Weekly', location: '/mnt/backup2', status: 'Inactive' },
        { id: 3, name: 'Backup 3', schedule: 'Monthly', location: '/mnt/backup3', status: 'Active' }
    ]);
    const [modalVisible, setModalVisible] = useState(false);


    const handleModalClose = () => setModalVisible(false);

    const handleModalOpen = () => setModalVisible(true);

    const handleSaveBackup = (newBackup) => {
        setBackups((prevBackups) => [
            ...prevBackups,
            { id: prevBackups.length + 1, ...newBackup }
        ]);
    };

    return (
        <>
            <div className="d-flex justify-content-end mb-4">
                <CButton color="primary" variant="outline" onClick={handleModalOpen}>
                    <CIcon icon={cilPlus} /> Add New Backup
                </CButton>
            </div>



            <BackupModal
                visible={modalVisible}
                onClose={handleModalClose}
                onSave={handleSaveBackup}
            />

            <CRow>
                <CCol xs={12}>
                    <CCard>
                        <CCardHeader><strong>Backups</strong></CCardHeader>
                        <CCardBody>

                            <CTable hover>
                                <CTableHead>
                                    <CTableRow>
                                        <CTableHeaderCell>Backup Name</CTableHeaderCell>
                                        <CTableHeaderCell>Schedule</CTableHeaderCell>
                                        <CTableHeaderCell>Location</CTableHeaderCell>
                                        <CTableHeaderCell>Status</CTableHeaderCell>
                                        <CTableHeaderCell>Actions</CTableHeaderCell>
                                    </CTableRow>
                                </CTableHead>
                                <CTableBody>
                                    {backups.map((backup) => (
                                        <CTableRow key={backup.id}>
                                            <CTableDataCell>{backup.name}</CTableDataCell>
                                            <CTableDataCell>{backup.schedule}</CTableDataCell>
                                            <CTableDataCell>{backup.location}</CTableDataCell>
                                            <CTableDataCell>
                                                <CBadge color={backup.status === 'Active' ? 'success' : 'secondary'}>
                                                    {backup.status}
                                                </CBadge>
                                            </CTableDataCell>
                                            <CTableDataCell className="d-flex justify-content-end gap-2">
                                                <CButton color="secondary" variant="outline" size="sm">
                                                    <CIcon icon={cilPencil} />
                                                </CButton>
                                                <CButton color="danger" variant="outline" size="sm">
                                                    <CIcon icon={cilTrash} />
                                                </CButton>
                                            </CTableDataCell>
                                        </CTableRow>
                                    ))}
                                </CTableBody>
                            </CTable>
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>
        </>
    );
};

export default Backup;
