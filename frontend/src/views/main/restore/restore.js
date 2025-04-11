import React, { useEffect, useState } from 'react'
import {
  CCard, CCardBody, CCardHeader, CSpinner,
  CBreadcrumb, CBreadcrumbItem, CAlert, CTable, CTableBody,
  CTableHead, CTableRow, CTableHeaderCell, CTableDataCell, CButton, CBadge
} from '@coreui/react'
import { Link } from 'react-router-dom'
// import { get_all_restores } from '../../../api/restore/restore_api'
import { cilPlus } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import RestoreModal from './restore-modal'

const Restore = () => {
  const [restores, setRestores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalVisible, setModalVisible] = useState(false);

  const handleModalClose = () => setModalVisible(false);
  const handleModalOpen = () => setModalVisible(true);

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

  function handleSaveRestore() {

  }

  return (
    <>
      <div className="d-flex justify-content-end mb-4">
        <CButton color="primary" variant="outline" onClick={handleModalOpen}>
          <CIcon icon={cilPlus} /> Restore a Backup
        </CButton>
      </div>


      <CBreadcrumb className="mb-4">
        <CBreadcrumbItem><Link to="/">Home</Link></CBreadcrumbItem>
        <CBreadcrumbItem active>Restore</CBreadcrumbItem>
      </CBreadcrumb>

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
                    <CTableHeaderCell>VM</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell>Started At</CTableHeaderCell>
                    <CTableHeaderCell>Ended At</CTableHeaderCell>
                    <CTableHeaderCell>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {restores.map((job) => (
                    <CTableRow key={job.id}>
                      <CTableDataCell><strong>{job.id}</strong></CTableDataCell>
                      <CTableDataCell>{job.vm_name}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={
                          job.status === 'Success' ? 'success' :
                          job.status === 'Running' ? 'warning' : 'danger'
                        }>
                          {job.status}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>{new Date(job.started_at).toLocaleString()}</CTableDataCell>
                      <CTableDataCell>
                        {job.completed_at ? new Date(job.completed_at).toLocaleString() : '-'}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton color="primary" size="sm" disabled title="Restore Again">
                          <CIcon icon={cilRestore} />
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
    </>
  )
}

export default Restore;
