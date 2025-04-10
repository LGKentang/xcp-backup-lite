import axios from 'axios'

const BASE_URL = import.meta.env.VITE_BACKEND_API

export async function get_active_vm_hierarchical(host_ip) {
    try {
        const vm_response = await axios.get(`${BASE_URL}/api/vm/list?host_ip=${host_ip}`);

        const active_host_response = await axios.get(`${BASE_URL}/api/hosts/list/active?host_ip=${host_ip}`);

        if (vm_response.data.code !== 200 || active_host_response.data.code !== 200) {
            console.error("Error fetching data");
            return;
        }

        const hostsMap = {};
        active_host_response.data.hosts.forEach(host => {
            hostsMap[host.uuid] = {
                name: host.name_label,
                address: host.address,
                vms: []
            };
        });

        vm_response.data.vms.forEach(vm => {
            const hostUuid = vm.host_uuid
            if (hostsMap[hostUuid]) {
                hostsMap[hostUuid].vms.push({
                    uuid: vm.uuid,
                    name_label: vm.name_label,
                    power_state: vm.power_state,
                    memory_static_max: vm.memory_static_max,
                    VCPUs_max: vm.VCPUs_max
                });
            }
        });

        const hierarchicalData = Object.values(hostsMap).map(host => ({
            host_name: host.name,
            address: host.address,
            vms: host.vms
        }));

        console.log('Hierarchical Data:', hierarchicalData);

        return hierarchicalData;

    } catch (error) {
        console.error('Failed to fetch or process data:', error);
    }
}
