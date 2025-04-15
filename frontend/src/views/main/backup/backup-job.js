import React, { useEffect, useState, Fragment } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CBreadcrumb,
  CBreadcrumbItem,
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CSpinner,
  CAlert,
  CBadge,
  CButton,
  CCollapse,
} from '@coreui/react';
import { cilMediaPlay, cilPencil, cilTrash } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import { fetch_backup_by_id, update_backup } from '../../../api/backup/backup_api';
import { get_backup_jobs_by_id, runBackupJob } from '../../../api/jobs/jobs';
// import { update_backup_by_id } from '../../../api/backup/backup_api';

const BackupJob = () => {
  const { backup_id } = useParams();
  const [backup, setBackup] = useState(null);
  const [formData, setFormData] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [runningJob, setRunningJob] = useState(false);
  const [openJobId, setOpenJobId] = useState(null);

  const pad = (num) => String(num).padStart(2, '0');
  const formatDuration = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const fetchData = async () => {
    try {
      const [backupData, jobData] = await Promise.all([
        fetch_backup_by_id(backup_id),
        get_backup_jobs_by_id(backup_id),
      ]);
      setBackup(backupData);
      setFormData(backupData);
      if (jobData.success) setJobs(jobData.data.jobs);
      else console.error(jobData.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [backup_id]);

  const handleRunBackup = async () => {
    setRunningJob(true);
    try {
      [1000, 3000].forEach(delay => {
        setTimeout(() => fetchData(), delay);
      });
      const result = await runBackupJob({
        host_ip: backup.host_ip,
        vm_uuid: backup.vm_uuid,
        sr_uuid: backup.sr_uuid,
        backup_id: parseInt(backup_id),
      });
      alert(result.success ? '✅ Backup finished successfully.' : `❌ Backup failed: ${result.output}`);
    } catch (err) {
      alert(`❌ Unexpected error: ${err.message}`);
    } finally {
      setRunningJob(false);
    }
  };

  const handleSave = async () => {
    try {
      // Only include fields that are editable
      const editableFields = ['name', 'description', 'cron_schedule', 'retention', 'active'];
      const updatedFields = {};
      editableFields.forEach((key) => {
        if (formData[key] !== backup[key]) {
          updatedFields[key] = formData[key];
        }
      });

      const response = await update_backup(backup_id, updatedFields, fetchData);
      if (response.success) {
        setEditMode(false);
      } else {
        alert(`❌ Failed to update backup: ${response.error}`);
      }
    } catch (err) {
      alert(`❌ Unexpected error: ${err.message}`);
    }
  };

  if (loading) return <CSpinner color="primary" />;
  if (error) return <CAlert color="danger">Error: {error}</CAlert>;

  return (
    <>
      <CBreadcrumb className="mb-4">
        <CBreadcrumbItem><Link to="/">Home</Link></CBreadcrumbItem>
        <CBreadcrumbItem><Link to="/main/backup">Backup</Link></CBreadcrumbItem>
        <CBreadcrumbItem active>{backup.name}</CBreadcrumbItem>
      </CBreadcrumb>

      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>{backup.name}</strong>
          <div className="d-flex gap-2">
            <CButton title="Run Backup Once" color="success" variant="outline" size="sm" onClick={handleRunBackup} disabled={runningJob}>
              {runningJob ? <CSpinner size="sm" /> : <CIcon icon={cilMediaPlay} />}
            </CButton>

            {editMode ? (
              <>
                <CButton title="Save" color="primary" variant="outline" size="sm" onClick={handleSave}>
                  Save
                </CButton>
                <CButton title="Cancel" color="secondary" variant="outline" size="sm" onClick={() => {
                  setFormData(backup);
                  setEditMode(false);
                }}>
                  Cancel
                </CButton>
              </>
            ) : (
              <CButton title="Edit Backup" color="secondary" variant="outline" size="sm" onClick={() => setEditMode(true)}>
                <CIcon icon={cilPencil} />
              </CButton>
            )}

            <CButton title="Delete Backup" color="danger" variant="outline" size="sm">
              <CIcon icon={cilTrash} />
            </CButton>
          </div>
        </CCardHeader>

        <CCardBody>
          {[
            ['Name', 'name'],
            ['Description', 'description'],
            ['VM', 'vm_name'],
            ['SR', 'sr_name'],
            ['Host IP', 'host_ip'],
            ['Schedule', 'cron_schedule'],
            ['Retention', 'retention'],
            ['Active', 'active'],
          ].map(([label, key]) => {
            const isEditable = !['vm_name', 'sr_name', 'host_ip'].includes(key);

            return (
              <CRow className="mb-2" key={key}>
                <CCol md={3}><strong>{label}</strong></CCol>
                <CCol>
                  {editMode && isEditable ? (
                    key === 'active' ? (
                      <select
                        className="form-select"
                        value={formData[key] ? 'true' : 'false'}
                        onChange={(e) =>
                          setFormData({ ...formData, [key]: e.target.value === 'true' })
                        }
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    ) : (
                      <input
                        className="form-control"
                        value={formData[key] || ''}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                      />
                    )
                  ) : key === 'active' ? (
                    <CBadge color={backup[key] ? 'success' : 'secondary'}>
                      {backup[key] ? 'Yes' : 'No'}
                    </CBadge>
                  ) : (
                    backup[key]
                  )}
                </CCol>
              </CRow>
            );
          })}

          <CRow className="mb-2">
            <CCol md={3}><strong>Created At</strong></CCol>
            <CCol>{new Date(backup.created_at).toLocaleString()}</CCol>
          </CRow>
        </CCardBody>
      </CCard>

      <CCard className="my-4">
        <CCardHeader><strong>Backup Job History</strong></CCardHeader>
        <CCardBody>
          {jobs.length === 0 ? (
            <CAlert color="info">No job history available for this backup.</CAlert>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Status</th>
                    <th>Started At</th>
                    <th>Ended At</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                {[...jobs].reverse().map((job) => {
                    const started = new Date(job.started_at);
                    const ended = job.completed_at ? new Date(job.completed_at) : null;
                    const duration = ended ? formatDuration(ended - started) : '-';
                    const badgeColor = job.status === 'Success' ? 'success' : job.status === 'Running' ? 'warning' : 'danger';
                    const isOpen = openJobId === job.id;

                    return (
                      <Fragment key={job.id}>
                        <tr onClick={() => setOpenJobId(isOpen ? null : job.id)} style={{ cursor: 'pointer' }}>
                          <td><strong>{job.id}</strong></td>
                          <td><CBadge color={badgeColor}>{job.status}</CBadge></td>
                          <td>{started.toLocaleString()}</td>
                          <td>{ended ? ended.toLocaleString() : '-'}</td>
                          <td>{duration}</td>
                        </tr>
                        <tr>
                          <td colSpan="5" className="p-0">
                            <CCollapse visible={isOpen}>
                              <div className="p-3 border-top">
                                <pre className="m-0" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                  {job.output_message}
                                </pre>
                              </div>
                            </CCollapse>
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CCardBody>
      </CCard>
    </>
  );
};

export default BackupJob;
