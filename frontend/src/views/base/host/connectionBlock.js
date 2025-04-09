import React, { useEffect, useState } from 'react'
import {
  CTableRow, CTableDataCell, CBadge, CButton
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilTrash } from '@coreui/icons'
import { test_connect_host } from '../../../api/xapi/connection_api'

export const ConnectionBlock = ({ host, handleDelete }) => {
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const testConnection = async () => {
      setConnectionStatus('connecting') // Optional: reset on host change
      const result = await test_connect_host({
        host_ip: host.ip,
      })

      if (result.success) {
        setConnectionStatus('connected')
      } else {
        setConnectionStatus('failed')
        setErrorMessage(result.message)
        console.error(`Connection failed: ${result.message}`, result.details)
      }
    }

    testConnection()
  }, [host])

  const renderConnectionBadge = (connection) => {
    switch (connection) {
      case 'connected':
        return <CBadge color="success">Connected</CBadge>
      case 'failed':
        return <CBadge color="danger" title={errorMessage}>Failed</CBadge>
      case 'connecting':
      default:
        return <CBadge color="secondary">Connecting...</CBadge>
    }
  }

  return (
    <CTableRow key={host.id}>
      <CTableDataCell>{host.label}</CTableDataCell>
      <CTableDataCell>{host.ip}</CTableDataCell>
      <CTableDataCell>{host.username}</CTableDataCell>
      <CTableDataCell>
        <span style={{ color: 'gray', textDecoration: 'underline', cursor: 'pointer' }}>
          {host.password}
        </span>
      </CTableDataCell>
      <CTableDataCell>
        <CBadge color={host.status === 'enabled' ? 'success' : 'secondary'}>
          ● {host.status.charAt(0).toUpperCase() + host.status.slice(1)}
        </CBadge>
      </CTableDataCell>
      <CTableDataCell>
        {renderConnectionBadge(connectionStatus)}
      </CTableDataCell>
      <CTableDataCell className="d-flex justify-content-end gap-2">
        <CButton
          color="danger"
          variant="outline"
          size="sm"
          onClick={() => handleDelete(host.id)}
        >
          <CIcon icon={cilTrash} />
        </CButton>
      </CTableDataCell>
    </CTableRow>
  )
}
