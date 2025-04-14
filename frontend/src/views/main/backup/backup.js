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

  const handleRun = (backupObject) => {
    console.log('Running backup:', backupObject);
    // TODO: Run logic
  };

  const handleEdit = (backupObject) => {
    console.log('Editing backup:', backupObject);
    // TODO: Edit logic
  };

  const handleDelete = (backupObject) => {
    console.log('Deleting backup:', backupObject);
    // TODO: Delete logic
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
                          <CTableDataCell className="d-flex justify-content-end gap-2">
                            <CButton
                              title="Run Backup Once"
                              color="success"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRun(backup);
                              }}
                            >
                              <CIcon icon={cilMediaPlay} />
                            </CButton>
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
