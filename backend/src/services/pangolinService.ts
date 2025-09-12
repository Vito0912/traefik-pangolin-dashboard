import axios from 'axios';

class PangolinService {
  private pangolinServiceData: {
    resourceId: string;
    name: string;
    fullDomain: string;
    orgId: string;
  }[] = [];

  private API_URL = process.env.PANGOLIN_API_URL;
  private API_TOKEN = process.env.PANGOLIN_API_TOKEN;

  async updatePangolinServiceData() {
    if (!this.API_URL) {
      console.warn('PANGOLIN_API_URL is not defined');
      return;
    }
    if (!this.API_TOKEN) {
      console.warn('PANGOLIN_API_TOKEN is not defined');
      return;
    }
    const currentOrgs =
      (
        await axios.get(`${this.API_URL}/v1/orgs?limit=1000`, {
          headers: {
            Authorization: `Bearer ${this.API_TOKEN}`
          }
        })
      ).data.data.orgs || [];

    for (const org of currentOrgs) {
      const resources =
        (
          await axios.get(`${this.API_URL}/v1/org/${org.orgId}/resources?limit=1000`, {
            headers: {
              Authorization: `Bearer ${this.API_TOKEN}`
            }
          })
        ).data.data.resources || [];
      this.pangolinServiceData.push(
        ...resources.map((resource: any) => ({
          resourceId: resource.resourceId,
          name: resource.name,
          fullDomain: resource.fullDomain,
          orgId: org.orgId
        }))
      );
    }
  }

  getPangolinServiceData(): {
    resourceId: string;
    name: string;
    fullDomain: string;
    orgId: string;
  }[] {
    return this.pangolinServiceData;
  }
}

export const pangolinService = new PangolinService();
