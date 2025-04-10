import React, { useEffect, useState, useRef } from 'react'
import {
    CTableRow, CTableDataCell, CBadge, CButton
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilTrash } from '@coreui/icons'
import { test_connect_host } from '../../../api/xapi/connection_api'
import { update_host_detail } from '../../../api/host/host_api'

export const ConnectionBlock = ({ host, handleDelete, handleUpdate}) => {
    const [connectionStatus, setConnectionStatus] = useState('connecting')
    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        const testConnection = async () => {
            setConnectionStatus('connecting')
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
                return <CBadge color="success">● Connected</CBadge>
            case 'failed':
                return <CBadge color="danger" title={errorMessage}>● Failed</CBadge>
            case 'connecting':
            default:
                return <CBadge color="secondary">● Connecting...</CBadge>
        }
    }

    return (
        <CTableRow key={host.id}>
            <CTableDataCell>
                <EditableCell value={host.name} onSave={(val) => update_host_detail(host.id, { name: val }, handleUpdate)} />
            </CTableDataCell>
            <CTableDataCell>
                <EditableCell value={host.ip} onSave={(val) => update_host_detail(host.id, { host_ip: val }, handleUpdate)} />
            </CTableDataCell>
            <CTableDataCell>
                <EditableCell value={host.username} onSave={(val) => update_host_detail(host.id, { username: val }, handleUpdate)} />
            </CTableDataCell>
            <CTableDataCell>
                <EditablePasswordCell onSave={(val) => update_host_detail(host.id, { password: val }, handleUpdate)} />
            </CTableDataCell>

            {/* <CTableDataCell>
                <CBadge color={host.status === 'enabled' ? 'success' : 'secondary'}>
                    ● {host.status.charAt(0).toUpperCase() + host.status.slice(1)}
                </CBadge>
            </CTableDataCell> */}
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

const EditableCell = ({ value, onSave }) => {
    return (
        <div
            contentEditable
            suppressContentEditableWarning
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault()
                    e.currentTarget.blur()
                }
            }}
            onBlur={(e) => onSave(e.currentTarget.innerText.trim())}
        >
            {value}
        </div>
    )
}

const EditablePasswordCell = ({ onSave }) => {
    const [editing, setEditing] = useState(false)
    const ref = useRef(null)
  
    const handleBlur = () => {
      const newVal = ref.current.innerText.trim()
      if (newVal !== '') onSave(newVal)
      setEditing(false)
    }
  
    return (
      <span
        style={{
          color: editing ? 'white' : 'gray',
          cursor: 'pointer',
          minWidth: '60px',
          display: 'inline-block',
        }}
        contentEditable={editing}
        suppressContentEditableWarning
        ref={ref}
        onClick={() => {
          setEditing(true)
          setTimeout(() => {
            ref.current.innerText = ''
            ref.current.focus()
          }, 0)
        }}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            ref.current.blur()
          }
        }}
      >
        {!editing ? '********' : ''}
      </span>
    )
  }
  