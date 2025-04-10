import React, { useState, useEffect, useRef } from 'react'
import {
    CCard, CCardBody, CCardHeader, CCol, CRow,
    CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow,
    CFormInput, CButton, CBadge
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilTrash } from '@coreui/icons'
import { add_host_connection, fetch_connected_host, delete_host } from '../../../api/host/host_api'
import { ConnectionBlock } from './connectionBlock'

const HostTable = () => {
    const [hosts, setHosts] = useState([])
    const [forceClearKey, setForceClearKey] = useState(0)

    const newHostRef = useRef({
        name: '',
        host_ip: '',
        username: '',
        password: ''
    })

    const handleInputChange = (field, value) => {
        newHostRef.current[field] = value
    }

    const handleConnect = async () => {
        const data = newHostRef.current
        if (!data.host_ip || !data.username || !data.password) {
            alert("Host IP, username, and password are required.")
            return
        }

        const response = await add_host_connection(data)

        if (response.success) {
            const newHost = {
                id: response.data.host.id,
                name: response.data.host.name,
                ip: response.data.host.host_ip,
                username: data.username,
                password: '********',
                status: 'enabled',
                connection: 'connected',
            }
            setHosts(prev => [...prev, newHost])

            newHostRef.current = { name: '', host_ip: '', username: '', password: '' }
            setForceClearKey(prev => prev + 1)
        } else {
            alert("Failed to connect: " + (response.error?.error || "Unknown error"))
        }
    }

    const handleDelete = async (id) => {
        const confirmed = window.confirm("Are you sure you want to delete this host?");
        if (!confirmed) return;

        const result = await delete_host(id);

        if (result.success) {
            setHosts((prev) => prev.filter((host) => host.id !== id));
        } else {
            alert(`Failed to delete host: ${result.error?.error || result.error || 'Unknown error'}`);
        }
    };

    const handleUpdate = async () => {
        await fetchData()
      }


    const fetchData = async () => {
        try {
            const response = await fetch_connected_host()
            const fetchedHosts = response.map((host) => ({
                id: host.id,
                name: host.name,
                ip: host.host_ip,
                username: host.username,
                status: 'enabled',
                connection: 'connected',
            }))
            setHosts(fetchedHosts)
        } catch (error) {
            console.error('Failed to fetch hosts:', error)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])
    return (
        <CRow>
            <CCol xs={12}>
                <CCard>
                    <CCardHeader><strong>Hosts</strong></CCardHeader>
                    <CCardBody>
                        <CTable hover responsive>
                            <CTableHead>
                                <CTableRow>
                                    <CTableHeaderCell>Name</CTableHeaderCell>
                                    <CTableHeaderCell>Host</CTableHeaderCell>
                                    <CTableHeaderCell>Username</CTableHeaderCell>
                                    <CTableHeaderCell>Password</CTableHeaderCell>
                                    <CTableHeaderCell>Status</CTableHeaderCell>
                                    {/*  */}
                                    <CTableHeaderCell></CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                {hosts.map((host, index) => (
                                    <ConnectionBlock key={index} handleDelete={handleDelete} handleUpdate={handleUpdate} host={host} />
                                ))}
                                <CTableRow key={forceClearKey}>
                                    <CTableDataCell>
                                        <CFormInput
                                            defaultValue=""
                                            placeholder="name"
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                        />
                                    </CTableDataCell>
                                    <CTableDataCell>
                                        <CFormInput
                                            defaultValue=""
                                            placeholder="address"
                                            onChange={(e) => handleInputChange('host_ip', e.target.value)}
                                        />
                                    </CTableDataCell>
                                    <CTableDataCell>
                                        <CFormInput
                                            defaultValue=""
                                            placeholder="username"
                                            onChange={(e) => handleInputChange('username', e.target.value)}
                                        />
                                    </CTableDataCell>
                                    <CTableDataCell>
                                        <CFormInput
                                            type="password"
                                            defaultValue=""
                                            placeholder="password"
                                            onChange={(e) => handleInputChange('password', e.target.value)}
                                        />
                                    </CTableDataCell>
                                    <CTableDataCell />
                                    <CTableDataCell>
                                        <CButton color="primary" size="sm" onClick={handleConnect}>
                                            Connect
                                        </CButton>
                                    </CTableDataCell>
                                    <CTableDataCell />
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
