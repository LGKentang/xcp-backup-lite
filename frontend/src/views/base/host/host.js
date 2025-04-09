import React, { useState, useEffect } from 'react'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow,
  CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow,
  CFormInput, CButton, CBadge
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilTrash } from '@coreui/icons'
import { fetch_connected_host } from '../../../api/host/host_api'
import {ConnectionBlock} from './connectionBlock'

const HostTable = () => {
  const [hosts, setHosts] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch_connected_host()
        console.log(response)
        const fetchedHosts = response.map((host) => ({
          id: host.id,
          label: host.name || 'Unnamed',
          ip: host.host_ip,
          username: host.username,
          password: '********',
          status: 'enabled',
          connection: 'connected',
        }))
        setHosts(fetchedHosts)
      } catch (error) {
        console.error('Failed to fetch hosts:', error)
      }
    }

    fetchData()
  }, [])

  const handleDelete = (id) => {
    setHosts((prev) => prev.filter((host) => host.id !== id))
  }

  const toggleConnection = (id) => {
    setHosts((prevHosts) =>
      prevHosts.map((host) =>
        host.id === id
          ? {
              ...host,
              status: host.status === 'enabled' ? 'disabled' : 'enabled',
              connection:
                host.status === 'enabled'
                  ? 'idle'
                  : Math.random() > 0.2
                  ? 'connected'
                  : 'failed',
            }
          : host
      )
    )
  }

  const renderConnectionBadge = (connection) => {
    switch (connection) {
      case 'connected':
        return <CBadge color="success">Connected</CBadge>
      case 'failed':
        return <CBadge color="danger">Failed</CBadge>
      default:
        return <CBadge color="secondary">Idle</CBadge>
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard>
          <CCardHeader><strong>Hosts</strong></CCardHeader>
          <CCardBody>
            <CTable hover responsive>
              <CTableHead color="dark">
                <CTableRow>
                  <CTableHeaderCell>Label</CTableHeaderCell>
                  <CTableHeaderCell>Host</CTableHeaderCell>
                  <CTableHeaderCell>Username</CTableHeaderCell>
                  <CTableHeaderCell>Password</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Connection</CTableHeaderCell>
                  <CTableHeaderCell></CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {hosts.map((host) => (
                  <ConnectionBlock host={host}/>
                ))}
                <CTableRow>
                  <CTableDataCell><CFormInput placeholder="label" /></CTableDataCell>
                  <CTableDataCell><CFormInput placeholder="address[:port]" /></CTableDataCell>
                  <CTableDataCell><CFormInput placeholder="username" /></CTableDataCell>
                  <CTableDataCell><CFormInput type="password" placeholder="password" /></CTableDataCell>
                  <CTableDataCell />
                  <CTableDataCell />
                  <CTableDataCell>
                    <CButton color="primary" size="sm">Connect</CButton>
                  </CTableDataCell>
                </CTableRow>
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default HostTable
