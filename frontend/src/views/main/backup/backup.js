import React, { useEffect, useState } from 'react';
import {
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CButton,
  CBadge,
  CRow,
  CCol,
  CCard,
  CCardHeader,
  CCardBody,
  CSpinner,
  CAlert,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilTrash, cilPlus, cilPencil, cilMediaPlay } from '@coreui/icons';
import BackupModal from './backup-modal.js';
import { add_backup, fetch_backups } from '../../../api/backup/backup_api.js';
import { useNavigate } from 'react-router-dom';
import { runBackupJob } from '../../../api/jobs/jobs.js';

const Backup = () => {
  const [backups, setBackups] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const navigate = useNavigate();

  const handleModalClose = () => setModalVisible(false);
  const handleModalOpen = () => setModalVisible(true);

  useEffect(() => {
    const handleFetchBackup = async () => {
      try {
        const response = await fetch_backups();
        if (response) {
          console.log(response)
          setBackups(response

          )
        } else {
          throw new Error(response.message)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }

    };
    handleFetchBackup();
  }, []);

  const handleRunBackup = async (backup, setRunningJob) => {
    setRunningJob(true);
    try {
      const result = await runBackupJob({
        host_ip: backup.host_ip,
        vm_uuid: backup.vm_uuid,
        sr_uuid: backup.sr_uuid,
        backup_id: parseInt(backup.id),
      });
    } catch (err) {
      alert(`❌ Unexpected error: ${err.message}`);
    } finally {
      setRunningJob(false);
    }
  };

  const handleEdit = (backupObject) => {
    console.log('Editing backup:', backupObject);
    navigate(`/main/backup/${backupObject.id}`)
  };

  const handleDelete = (backupObject) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete the backup: ${backupObject.name || 'this item'}?`);
    if (!confirmDelete) return;

    console.log('Deleting backup:', backupObject);
  };


  const handleSaveBackup = (newBackup) => {
    setBackups((prevBackups) => [
      ...prevBackups,
      { id: prevBackups.length + 1, ...newBackup },
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
            <CCardHeader>
              <strong>Backups</strong>
            </CCardHeader>
            <CCardBody>
              {loading ? (
                <CSpinner color="primary" />
              ) : error ? (
                <CAlert color="danger">Error: {error}</CAlert>
              ) : backups && backups.length === 0 ? (
                <CAlert color="info">No backup jobs found.</CAlert>
              ) : (

                <div className='table-responsive'>
                  <CTable hover responsive>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Name</CTableHeaderCell>
                        <CTableHeaderCell>Description</CTableHeaderCell>
                        <CTableHeaderCell>Location</CTableHeaderCell>
                        <CTableHeaderCell>Status</CTableHeaderCell>
                        <CTableHeaderCell></CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {backups && backups.map((backup) => (
                        <CTableRow
                          key={backup.id}
                          onClick={() => navigate(`/main/backup/${backup.id}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <CTableDataCell>{backup.name}</CTableDataCell>
                          <CTableDataCell>
                            {backup.description?.split(' ').slice(0, 50).join(' ') +
                              (backup.description?.split(' ').length > 50 ? '...' : '')}
                          </CTableDataCell>
                          <CTableDataCell>
                            {backup.sr_name} ({backup.host_ip})
                          </CTableDataCell>
                          <CTableDataCell>
                            <CBadge color={backup.active ? 'success' : 'secondary'}>
                              {backup.active ? 'Active' : 'Inactive'}
                            </CBadge>
                          </CTableDataCell>
                          <CTableDataCell>
                            <div style={{ display: 'flex', gap: '.5rem' }}>
                              <RunningJobButton backup={backup} handleRunBackup={handleRunBackup}/>
                              <CButton
                                title="Edit Backup"
                                color="secondary"
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(backup);
                                }}
                              >
                                <CIcon icon={cilPencil} />
                              </CButton>
                              <CButton
                                title="Delete Backup"
                                color="danger"
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(backup);
                                }}
                              >
                                <CIcon icon={cilTrash} />
                              </CButton>
                            </div>
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  );
};

export default Backup;


const RunningJobButton = ({ handleRunBackup, backup }) => {
  const [runningJob, setRunningJob] = useState(false);
  return <>
    <CButton title="Run Backup Once" color="success" variant="outline" size="sm"
      onClick={(e) => {
        e.stopPropagation();
        handleRunBackup(backup, setRunningJob);
      }} disabled={runningJob}>
      {runningJob ? <CSpinner size="sm" /> : <CIcon icon={cilMediaPlay} />}
    </CButton>
  </>
}

