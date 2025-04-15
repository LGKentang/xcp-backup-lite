import React, { useEffect, useState } from 'react'
import {
  CCard, CCardBody, CCardHeader, CSpinner,
  CBreadcrumb, CBreadcrumbItem, CAlert, CTable, CTableBody,
  CTableHead, CTableRow, CTableHeaderCell, CTableDataCell, CButton, CBadge
} from '@coreui/react'
import { Link } from 'react-router-dom'
import { get_all_restores } from '../../../api/restore/restore_api'
import { cilPencil, cilPlus, cilRecycle, cilTrash } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import RestoreModal from './restore-modal'
import { useNavigate } from 'react-router-dom';

const Restore = () => {
  const [restores, setRestores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalVisible, setModalVisible] = useState(false);

  const handleModalClose = () => setModalVisible(false);
  const handleModalOpen = () => setModalVisible(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestores = async () => {
      try {
        const result = await get_all_restores()
        if (result.success) {
          setRestores(result.data)
        } else {
          throw new Error(result.message)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchRestores()
  }, [])

  function handleSaveRestore(restore) {
    setRestores((prevRestore) => [
      ...prevRestore,
      { id: prevRestore.length + 1, ...restore },
    ]);
  }

  return (
    <>

      <div className="d-flex justify-content-end mb-4">
        <CButton color="primary" variant="outline" onClick={handleModalOpen}>
          <CIcon icon={cilPlus} /> Add Restore Plan
        </CButton>
      </div>

      <RestoreModal
        visible={modalVisible}
        onClose={handleModalClose}
        onSave={handleSaveRestore}
      />


      <CCard>
        <CCardHeader>
          <strong>Restore Jobs</strong>
        </CCardHeader>
        <CCardBody>
          {loading ? (
            <CSpinner color="primary" />
          ) : error ? (
            <CAlert color="danger">Error: {error}</CAlert>
          ) : restores.length === 0 ? (
            <CAlert color="info">No restore jobs found.</CAlert>
          ) : (
            <div className="table-responsive">
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>ID</CTableHeaderCell>
                    <CTableHeaderCell>Backup</CTableHeaderCell>
                    <CTableHeaderCell>VM Name</CTableHeaderCell>
                    <CTableHeaderCell>To SR</CTableHeaderCell>
                    <CTableHeaderCell></CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {restores.map((restore) => (
                    <CTableRow
                      key={restore.id}
                      onClick={() => navigate(`/main/restore/${restore.id}`)}
                    >
                      <CTableDataCell><strong>{restore.id}</strong></CTableDataCell>
                      <CTableDataCell>{restore.backup_name}</CTableDataCell>
                      <CTableDataCell>{restore.vm_name}</CTableDataCell>
                      <CTableDataCell>{restore.sr_name}</CTableDataCell>
                      <CTableDataCell>
                        <div className="d-flex gap-2">
                          <CButton color="primary" size="sm" title="Restore Again">
                            <CIcon icon={cilRecycle} />
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
    </>
  )
}

export default Restore;
