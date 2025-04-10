import React, { useEffect, useState } from 'react';
import { CTable, CTableHead, CTableBody, CTableRow, CTableHeaderCell, CTableDataCell, CButton, CBadge, CRow, CCol, CCard, CCardHeader, CCardBody } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilTrash, cilPlus, cilPencil, cilMediaPlay} from '@coreui/icons';
import BackupModal from './backup-modal.js';
import { add_backup, fetch_backups } from '../../../api/backup/backup_api.js';


const Backup = () => {
    const [backups, setBackups] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);


    const handleModalClose = () => setModalVisible(false);

    const handleModalOpen = () => setModalVisible(true);

    useEffect(()=>{
        const handleFetchBackup = async () => {
            const response = await fetch_backups();
            console.log(response)
            setBackups(response)
        }
        handleFetchBackup()
    },[])

    const handleRun = (backupObject) => {

    }

    const handleSaveBackup = (newBackup) => {

        // Step 4: If successful, add the new backup to the list
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
                                            <CTableDataCell>{backup.cron_schedule}</CTableDataCell>
                                            <CTableDataCell>{backup.location}</CTableDataCell>
                                            <CTableDataCell>
                                                {/* why doesnt this show vv */}
                                                <CBadge color={backup.active == true ? 'success' : 'secondary'}>
                                                    {backup.status}
                                                </CBadge>
                                            </CTableDataCell>
                                            <CTableDataCell className="d-flex justify-content-end gap-2">
                                            <CButton color="secondary" variant="outline" size="sm">
                                                    <CIcon icon={cilMediaPlay} />
                                                </CButton>
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
