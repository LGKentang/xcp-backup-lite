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
    CFormInput,
} from '@coreui/react';
import { cilMediaPlay, cilPencil, cilTrash, cilSave } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import { get_restore_by_id, update_restore_by_id } from '../../../api/restore/restore_api';
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
    const [editMode, setEditMode] = useState(false);
    const [formState, setFormState] = useState({
        backup_name: '',
        vm_name: '',
        preserve: false,
        power_on_after_restore: false,
    });

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
            const [restoreData, jobData] = await Promise.all([
                get_restore_by_id(restore_id),
                get_restore_jobs_by_id(restore_id),
            ]);

            setRestore(restoreData.data);
            setFormState({
                backup_name: restoreData.data.backup_name,
                vm_name: restoreData.data.vm_name,
                preserve: restoreData.data.preserve,
                power_on_after_restore: restoreData.data.power_on_after_restore,
            });

            if (jobData.success) setJobs(jobData.data.jobs);
            else console.error(jobData.message);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchRestoreData = async () => {
        try {
            const restoreData =  await get_restore_by_id(restore_id);
            setRestore(restoreData.data);
            setFormState({
                backup_name: restoreData.data.backup_name,
                vm_name: restoreData.data.vm_name,
                preserve: restoreData.data.preserve,
                power_on_after_restore: restoreData.data.power_on_after_restore,
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, [restore_id]);

    useEffect(() => {
        if (!restore) return;
        (async () => {
            try {
                const versions = await fetch_backup_versions_by_backup_id(restore.backup_id);
                setBackupVersions(versions);
            } catch (err) {
                console.error('Failed to fetch backup versions:', err);
            }
        })();
    }, [restore]);

    const handleRunRestore = async () => {
        setRunningJob(true);

        if (!selectedBackupVersion && !latestToggle) return;
        try {
            const result = await runRestoreJob({
                host_ip: restore.host_ip,
                sr_uuid: restore.sr_uuid,
                job_uuid: latestToggle ? '' : selectedBackupVersion.job_uuid,
                vm_uuid: selectedBackupVersion?.backup?.vm_uuid,
                restore_id: restore_id,
                backup_id: restore.backup_id,
                is_latest_backup: latestToggle,
            });
            alert(result.success ? '✅ Restore finished successfully.' : `❌ Restore failed: ${result.output}`);
        } catch (err) {
            alert(`❌ Unexpected error: ${err.message}`);
        } finally {
            setRunningJob(false);
        }
    };

    const handleUpdate = async () => {
        try {
            const response = await update_restore_by_id(restore_id, {
                preserve: formState.preserve,
                power_on_after_restore: formState.power_on_after_restore,
            },fetchRestoreData);
            if (response.success) {
                // alert('✅ Restore configuration updated.');
                setEditMode(false);
            } else {
                alert('❌ Failed to update restore config.');
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
                <CBreadcrumbItem><Link to="/main/restore">Restore</Link></CBreadcrumbItem>
                <CBreadcrumbItem active>{restore.backup_name} Restore Job</CBreadcrumbItem>
            </CBreadcrumb>

            <CCard>
                <CCardHeader className="d-flex justify-content-between align-items-center">
                    <strong>{restore.backup_name}Restore Job</strong>
                    <div className="d-flex gap-2">
                        {editMode ? (
                            <>
                                <CButton title="Save" color="primary" variant="outline" size="sm" onClick={handleUpdate}>
                                    Save
                                </CButton>
                                <CButton
                                    title="Cancel"
                                    color="secondary"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setFormState({
                                            preserve: restore.preserve,
                                            power_on_after_restore: restore.power_on_after_restore,
                                        });
                                        setEditMode(false);
                                    }}
                                >
                                    Cancel
                                </CButton>
                            </>
                        ) : (
                            <CButton title="Edit Restore" color="secondary" variant="outline" size="sm" onClick={() => setEditMode(true)}>
                                <CIcon icon={cilPencil} />
                            </CButton>
                        )}

                        <CButton title="Delete Restore" color="danger" variant="outline" size="sm">
                            <CIcon icon={cilTrash} />
                        </CButton>
                    </div>
                </CCardHeader>

                <CCardBody>
                    <CRow className="mb-2">
                        <CCol md={3}><strong>Backup Name</strong></CCol>
                        <CCol>
                           {restore.backup_name}
                        </CCol>
                    </CRow>

                    <CRow className="mb-2">
                        <CCol md={3}><strong>VM Name</strong></CCol>
                        <CCol>
                           {restore.vm_name}
                        </CCol>
                    </CRow>

                    <CRow className="mb-2">
                        <CCol md={3}><strong>Preserve UUID</strong></CCol>
                        <CCol>
                            {editMode
                                ? <CFormSwitch checked={formState.preserve} onChange={() => setFormState({ ...formState, preserve: !formState.preserve })} />
                                : (restore.preserve ? 'Yes' : 'No')}
                        </CCol>
                    </CRow>

                    <CRow className="mb-2">
                        <CCol md={3}><strong>Power On After Restore</strong></CCol>
                        <CCol>
                            {editMode
                                ? <CFormSwitch checked={formState.power_on_after_restore} onChange={() => setFormState({ ...formState, power_on_after_restore: !formState.power_on_after_restore })} />
                                : (restore.power_on_after_restore ? 'Yes' : 'No')}
                        </CCol>
                    </CRow>

                    <CRow className="mb-2">
                        <CCol md={3}><strong>SR</strong></CCol>
                        <CCol>{`${restore.sr_name} (${restore.sr_uuid})`}</CCol>
                    </CRow>

                    <CRow className="mb-2">
                        <CCol md={3}><strong>Host IP</strong></CCol>
                        <CCol>{restore.host_ip}</CCol>
                    </CRow>

                    <CRow className="mb-2">
                        <CCol md={3}><strong>Backup ID</strong></CCol>
                        <CCol>{restore.backup_id}</CCol>
                    </CRow>

                    <CRow className="mb-2">
                        <CCol md={3}><strong>Created At</strong></CCol>
                        <CCol>{new Date(restore.restored_at).toLocaleString()}</CCol>
                    </CRow>
                </CCardBody>
            </CCard>

            <CCard className="my-4">
                <CCardHeader className="d-flex justify-content-between align-items-center">
                    <strong>Run a Restore Job</strong>
                    <CButton title="Run Restore" color="success" variant="outline" size="sm" onClick={handleRunRestore} disabled={runningJob}>
                        {runningJob ? <CSpinner size="sm" /> : <CIcon icon={cilMediaPlay} />}
                    </CButton>
                </CCardHeader>
                <CCardBody>
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
                </CCardBody>
            </CCard>

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

export default RestoreJob;
