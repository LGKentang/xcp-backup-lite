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
    CFormSwitch,
    CFormSelect,
} from '@coreui/react';
import { cilMediaPlay, cilPencil, cilTrash } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import { get_restore_by_id } from '../../../api/restore/restore_api';
import { runRestoreJob, get_restore_jobs_by_id } from '../../../api/jobs/jobs';
import { fetch_backup_versions_by_backup_id } from '../../../api/backup/backup_api';

const RestoreJob = () => {
    const { restore_id } = useParams();
    const [restore, setRestore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [runningJob, setRunningJob] = useState(false);
    const [openJobId, setOpenJobId] = useState(null);
    const [backupVersions, setBackupVersions] = useState([]);
    const [latestToggle, setLatestToggle] = useState(true);
    const [selectedBackupVersion, setSelectedBackupVersion] = useState(null);

    const pad = (num) => String(num).padStart(2, '0');
    const formatDuration = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [restoreData, jobData] = await Promise.all([
                    get_restore_by_id(restore_id),
                    get_restore_jobs_by_id(restore_id),
                ]);

                console.log(restoreData)

                console.log(jobData)

                setRestore(restoreData.data);
                if (jobData.success) setJobs(jobData.data.jobs);
                else console.error(jobData.message);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [restore_id]);

    useEffect(() => {
        if (!restore) return;
        (async () => {
            try {
                const versions = await fetch_backup_versions_by_backup_id(restore.backup_id);
                console.log(versions)
                setBackupVersions(versions);
            } catch (err) {
                console.error('Failed to fetch backup versions:', err);
            }
        })();
    }, [restore]);

    const handleRunRestore = async () => {
        setRunningJob(true);

        if (!selectedBackupVersion) return;
        console.log(selectedBackupVersion.backup)
        try {
            const result = await runRestoreJob({
                host_ip: restore.host_ip,
                sr_uuid: restore.sr_uuid,
                job_uuid: latestToggle ? '' : selectedBackupVersion.job_uuid,
                vm_uuid: selectedBackupVersion.backup.vm_uuid,
                restore_id: restore_id,
                is_latest_backup: latestToggle
            });
            alert(result.success ? '✅ Restore finished successfully.' : `❌ Restore failed: ${result.output}`);
        } catch (err) {
            alert(`❌ Unexpected error: ${err.message}`);
        } finally {
            setRunningJob(false);
        }
    };

    console.log(selectedBackupVersion)

    if (loading) return <CSpinner color="primary" />;
    if (error) return <CAlert color="danger">Error: {error}</CAlert>;

    return (
        <>
            <CCard>
                <CCardHeader className="d-flex justify-content-between align-items-center">
                    <strong>{restore.backup_name} Restore Job</strong>
                    <div className="d-flex gap-2">
                        <CButton title="Edit Restore" color="secondary" variant="outline" size="sm">
                            <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton title="Delete Restore" color="danger" variant="outline" size="sm">
                            <CIcon icon={cilTrash} />
                        </CButton>
                    </div>
                </CCardHeader>

                <CCardBody>
                    {[
                        ['Backup Name', restore.backup_name],
                        ['SR', `${restore.sr_name} (${restore.sr_uuid})`],
                        ['Host IP', restore.host_ip],
                        ['Preserve UUID', restore.preserve ? 'Yes' : 'No'],
                        ['Power On After Restore', restore.power_on_after_restore ? 'Yes' : 'No'],
                        ['Backup ID', restore.backup_id],
                        ['Created At', new Date(restore.restored_at).toLocaleString()],
                    ].map(([label, value]) => (
                        <CRow className="mb-2" key={label}>
                            <CCol md={3}><strong>{label}</strong></CCol>
                            <CCol>{value}</CCol>
                        </CRow>
                    ))}
                </CCardBody>
            </CCard>

            <CCard className="my-4">
                <CCardHeader className="d-flex justify-content-between align-items-center">
                    <strong>Run a Restore Job</strong>
                    <div className="d-flex gap-2">
                        <CButton title="Run Restore" color="success" variant="outline" size="sm" onClick={handleRunRestore} disabled={runningJob}>
                            {runningJob ? <CSpinner size="sm" /> : <CIcon icon={cilMediaPlay} />}
                        </CButton>
                    </div>
                </CCardHeader>
                <CCardBody>
                    {restore && restore.backup_id && (
                        <>
                            <>
                                <div className="mb-3 d-flex align-items-center gap-2">
                                    <label className="mb-0">Use Latest Backup</label>
                                    <CFormSwitch checked={latestToggle} onChange={() => setLatestToggle(!latestToggle)} />
                                </div>

                                {!latestToggle && (
                                    <div className="mb-3">
                                        <label>Backup Version</label>
                                        <CFormSelect
                                            value={selectedBackupVersion?.job_id?.toString() || ''}
                                            onChange={(e) => {
                                                const selected = backupVersions.find(v => v.job_id.toString() === e.target.value);
                                                setSelectedBackupVersion(selected);
                                            }}
                                        >
                                            <option disabled value="">Select version</option>
                                            {backupVersions.map((v) => (
                                                <option key={v.job_id} value={v.job_id}>
                                                    {`Backup Job ID : ${v.job_id} | Completed At : ${new Date(v.completed_at).toLocaleString()}`}
                                                </option>
                                            ))}
                                        </CFormSelect>
                                    </div>
                                )}

                            </>

                        </>
                    )}


                </CCardBody>
            </CCard >

            <CCard className="my-4">
                <CCardHeader><strong>Restore Job History</strong></CCardHeader>
                <CCardBody>
                    {jobs.length === 0 ? (
                        <CAlert color="info">No restore job history available.</CAlert>
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
                                    {jobs.map((job) => {
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

export default RestoreJob;
