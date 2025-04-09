import React from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CAccordion,
  CAccordionBody,
  CAccordionHeader,
  CAccordionItem,
} from '@coreui/react'

// Example host data
const hosts = [
  { id: 1, name: 'Host-1', ip: '192.168.1.10', status: 'Online' },
  { id: 2, name: 'Host-2', ip: '192.168.1.11', status: 'Offline' },
  { id: 3, name: 'Host-3', ip: '192.168.1.12', status: 'Online' },
]

const Accordion = () => {
  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Host List</strong>
          </CCardHeader>
          <CCardBody>
            <CAccordion alwaysOpen>
              {hosts.map((host) => (
                <CAccordionItem itemKey={host.id.toString()} key={host.id}>
                  <CAccordionHeader>
                    {host.name} — {host.status}
                  </CAccordionHeader>
                  <CAccordionBody>
                    <p><strong>IP Address:</strong> {host.ip}</p>
                    <p><strong>Status:</strong> {host.status}</p>
                    {/* Add actions like buttons if needed */}
                  </CAccordionBody>
                </CAccordionItem>
              ))}
            </CAccordion>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default Accordion
