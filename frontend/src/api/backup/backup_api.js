import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_API;


export async function fetch_backups() {
    try {
        console.log('Using backend API:', BASE_URL)
        const response = await axios.get(`${BASE_URL}/api/backup/list`)
        console.log('Fetched hosts:', response)
        return response.data
    } catch (error) {
        console.error('Failed to fetch hosts:', error)
        return []
    }
}

export async function add_backup({
  name,
  description,
  sr_uuid,
  host_id,
  active,
  retention,
  cron_schedule,
}) {
  try {
    console.log('Using backend API:', BASE_URL);

    const payload = {
      name,
      description,
      sr_uuid,
      host_id,
      active,
      retention,
      cron_schedule,
    };
    const response = await axios.post(`${BASE_URL}/api/backup/add`, payload);
    console.log('Backup added successfully:', response.data);

    return response.data["storage_repositories"];
  } catch (error) {
    console.error('Failed to add backup:', error);
    return []; 
  }
}
