/* eslint-disable @typescript-eslint/default-param-last */
/* eslint-disable no-useless-catch */
import got from 'got'
import { v4 as uuidv4 } from 'uuid'

enum AlertStatus {
  Acknowledged = 'Acknowledged',
  Resolved = 'Resolved',
  Unattended = 'Unattended'
}

enum UserRoles {
  Owner = 'power',
  Admin = 'admin',
  User = 'user'
}

/**
 * The Config for the Addigy class
 * This interface allows utilization of Addigy's internal API by using credentials of an actual user account
 * @export
 * @interface IAddigyConfig
 */
interface IAddigyConfig {
  /** the API credentials from Addigy */
  clientId: string
  clientSecret: string
  /** user account credentials with owner/power user role */
  adminUsername?: string
  adminPassword?: string
}

// interface customSoftwareStage {
//   label: string
//   public: boolean
//   run_on_success: boolean
//   version: string
//   category: string
//   provider: 'ansible-custom-software'
//   condition: string
//   base_identifier: 'Acrobat Reader'
//   editid: 'c95fa2ac-b371-4bf8-944b-fd970a608fa4'
//   downloads: object[]
//   policy_restricted: boolean
//   remove_script: string
//   instructionId: string
//   type: string
//   commands: []
//   icon: string
//   orgid: string
//   name: string,
//   description: string
//   'status_on_skipped': 'finished'
//   user_email: string,
//   'identifier': 'Acrobat Reader-3995dc02-eef6-444d-800d-80147bf21719'
//   'installation_script': '\n/usr/sbin/installer -pkg "/Library/Addigy/ansible/packages/Acrobat Reader (2020.9.20063)/AcroRdrDC_2000920063_MUI.pkg" -target /\n'
//   'software_icon': {
//     user_email: string,
//     'content_type': 'image/jpeg'
//     'size': 5666
//     'filename': 'acrobatDC.jpeg'
//     'provider': 'cloud-storaßge'
//     'created': '2020-07-22T15:32:48.19Z'
//     'md5_hash': '6b104b4296f7e4baff2a79f5f4cdb1a6'
//     'id': 'd35a7628-7e95-f3b7-ae2c-bd7ae3c85047'
//     'orgid': '52d49479-0a96-4027-8673-2baaa12379cf'
//   },
//   profiles: object[]

// }

/*
 * Various combinations of the auth token, organization ID, and email address of the callee are
 * required for different calls to Addigy's internal API endpoints. To make things easier,
 * they are all packaged together into a single authentication object
 */
interface IAddigyInternalAuthObject {
  orgId: string
  authToken: string
  emailAddress: string
}

class Addigy {
  config: IAddigyConfig
  domain: string
  reqHeaders: any

  constructor (_config: IAddigyConfig) {
    this.config = _config
    this.reqHeaders = {
      'content-type': 'application/json',
      accept: 'application/json',
      'client-id': this.config.clientId,
      'client-secret': this.config.clientSecret
    }
    this.domain = 'https://prod.addigy.com/api'
  }

  //
  // Instructions
  //

  async getPolicyInstructions (policyId: string, provider: string = 'ansible-profile'): Promise<object[]> {
    try {
      const res = await this._addigyRequest(
        `${this.domain}/policies/instructions?provider=${provider}&policy_id=${policyId}`,
        { headers: this.reqHeaders }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  async createPolicyInstructions (policyId: string, instructionId: string): Promise<object[]> {
    try {
      const res = await this._addigyRequest(
        `${this.domain}/policies/instructions`,
        {
          headers: this.reqHeaders,
          method: 'POST',
          body: JSON.stringify({
            instruction_id: instructionId,
            policy_id: policyId
          })
        }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  async deletePolicyInstructions (policyId: string, instructionId: string, provider: string = 'ansible-profile'): Promise<object[]> {
    try {
      const res = await this._addigyRequest(
        `${this.domain}/policies/instructions?policy_id=${policyId}&instruction_id=${instructionId}&provider=${provider}`,
        {
          headers: this.reqHeaders,
          method: 'DELETE'
        }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  //
  // Devices
  //

  async getOnlineDevices (): Promise<object[]> {
    try {
      const res = await this._addigyRequest(
        `${this.domain}/devices/online`,
        { headers: this.reqHeaders }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  async getDevices (): Promise<object[]> {
    try {
      const res = await this._addigyRequest(
        `${this.domain}/devices`,
        { headers: this.reqHeaders }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  async getPolicyDevices (policyId: string): Promise<object[]> {
    try {
      const res = await this._addigyRequest(
        `${this.domain}/policies/devices?policy_id=${policyId}`,
        { headers: this.reqHeaders }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  async updateDevicePolicy (policyId: string, agentId: string): Promise<object[]> {
    const postBody: any = {
      policy_id: policyId,
      agent_id: agentId
    }

    try {
      const res = await this._addigyRequest(
        `${this.domain}/policies/devices`,
        {
          headers: {
            'client-id': this.config.clientId,
            'client-secret': this.config.clientSecret
          },
          method: 'POST',
          form: true,
          body: postBody
        }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  //
  // Alerts
  //

  async getAlerts (status: AlertStatus, page: number = 1, pageLength: number = 10): Promise<object[]> {
    let statusUri = ''
    if (status) {
      statusUri = `&status=${status}`
    }

    try {
      const res = await this._addigyRequest(
        `${this.domain}/alerts?page=${page}&per_page=${pageLength}` + statusUri,
        { headers: this.reqHeaders }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  //
  // Policies
  //

  async getPolicies (): Promise<object[]> {
    try {
      const res = await this._addigyRequest(
        `${this.domain}/policies`,
        { headers: this.reqHeaders }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  async getPolicyDetails (policyId: string, provider: string = 'ansible-profile'): Promise<object[]> {
    try {
      const res = await this._addigyRequest(
        `${this.domain}/policies/details?provider=${provider}&policy_id=${policyId}`,
        { headers: this.reqHeaders }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  async createPolicy (name: string, parentId?: string, icon?: string, color?: string): Promise<object[]> {
    const postBody: any = {
      name: name
    }

    if (icon !== undefined) {
      postBody.icon = icon
    }

    if (color !== undefined) {
      postBody.color = color
    }

    if (parentId !== undefined) {
      postBody.parent_id = parentId
    }

    try {
      const res = await this._addigyRequest(
        `${this.domain}/policies`,
        {
          method: 'POST',
          form: true,
          body: postBody
        }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  //
  // Maintenance
  //

  async getMaintenance (page: number = 1, pageLenth: number = 10): Promise<object[]> {
    try {
      const res = await this._addigyRequest(
        `${this.domain}/maintenance?page=${page}&per_page=${pageLenth}`,
        { headers: this.reqHeaders }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  //
  // Applications
  //

  async getInstalledApplications (): Promise<object[]> {
    try {
      const res = await this._addigyRequest(
        `${this.domain}/applications`,
        { headers: this.reqHeaders }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  //
  // Profiles
  //

  async getProfiles (instructionId?: string): Promise<object[]> {
    let instructionUri = ''
    if (instructionId !== undefined) {
      instructionUri = `?instruction_id=${instructionId}`
    }

    try {
      const res = await this._addigyRequest(
        `${this.domain}/profiles` + instructionUri,
        { headers: this.reqHeaders }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  async createProfile (name: string, payloads: object[]): Promise<object[]> {
    const postBody: any = {
      name: name,
      payloads: payloads
    }

    try {
      const res = await this._addigyRequest(
        `${this.domain}/profiles`,
        {
          headers: this.reqHeaders,
          method: 'POST',
          json: true,
          body: postBody
        }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  async updateProfile (instructionId: string, payloads: object[]): Promise<object[]> {
    const postBody: any = {
      instruction_id: instructionId,
      payloads: payloads
    }

    try {
      const res = await this._addigyRequest(
        `${this.domain}/profiles`,
        {
          headers: this.reqHeaders,
          method: 'PUT',
          json: true,
          body: postBody
        }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  async deleteProfile (instructionId: string): Promise<object[]> {
    const postBody: any = {
      instruction_id: instructionId
    }

    try {
      const res = await this._addigyRequest(
        `${this.domain}/profiles`,
        {
          headers: this.reqHeaders,
          method: 'DELETE',
          json: true,
          body: postBody
        }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  //
  // Commands
  //

  async runCommand (agentIds: string[], command: string): Promise<object[]> {
    const postBody: any = {
      agent_ids: agentIds,
      command: command
    }

    try {
      const res = await this._addigyRequest(
        `${this.domain}/devices/commands`,
        {
          headers: this.reqHeaders,
          method: 'POST',
          json: true,
          body: postBody
        }
      )
      return res.body
    } catch (err) {
      throw err
    }
  }

  async getCommandOutput (actionId: string, agentId: string): Promise<object[]> {
    try {
      const res = await this._addigyRequest(
        `${this.domain}/devices/output?action_id=${actionId}&agentid=${agentId}`,
        { headers: this.reqHeaders }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  //
  // Public Software
  //

  async getPublicSoftware (): Promise<object[]> {
    try {
      const res = await this._addigyRequest(
        `${this.domain}/catalog/public`,
        { headers: this.reqHeaders }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  //
  // Custom Software
  //

  async getCustomSoftware (): Promise<object[]> {
    try {
      const res = await this._addigyRequest(
        `${this.domain}/custom-software`,
        { headers: this.reqHeaders }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  async getCustomSoftwareAllVersions (softwareId: string): Promise<object[]> {
    try {
      const res = await this._addigyRequest(
        `${this.domain}/custom-software?identifier=${softwareId}`,
        { headers: this.reqHeaders }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  async getCustomSoftwareSpecificVersion (instructionId: string): Promise<object[]> {
    try {
      const res = await this._addigyRequest(
        `${this.domain}/custom-software?instructionid=${instructionId}`,
        { headers: this.reqHeaders }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  async getFileUploadUrl (fileName: string, contentType?: string): Promise<string> {
    const headers = {
      'client-Id': this.config.clientId,
      'client-Secret': this.config.clientSecret,
      'file-name': fileName,
      'content-type': contentType ?? 'application/octet-stream'
    }

    try {
      const res = await this._addigyRequest(
        'https://file-manager-prod.addigy.com/api/upload/url',
        {
          headers: headers
        }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  async uploadFile (uploadUrl: string, file: object, contentType?: string): Promise<object[]> {
    const headers = {
      'content-type': contentType ?? 'application/octet-stream'
    }

    try {
      const res = await this._addigyRequest(`${uploadUrl}`, {
        headers: headers,
        body: file,
        method: 'PUT'
      })
      return res.body
    } catch (err) {
      throw err
    }
  }

  async getSmartFileInfo (
    authObject: IAddigyInternalAuthObject,
    fileId: string
  ): Promise<object[]> {
    try {
      const res = await this._addigyRequest(
        `https://app-prod.addigy.com/api/filebuilder/pkg/info?id=${fileId}`,
        {
          headers: {
            Cookie: `auth_token=${authObject.authToken};`
          },
          method: 'GET'
        }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  async getFileInfo (
    fileId: string
  ): Promise<object[]> {
    try {
      const res = await this._addigyRequest(
        ` https://file-manager-prod.addigy.com/api/upload/metadata/${fileId}`,
        {
          headers: this.reqHeaders,
          method: 'GET'
        }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  async copySoftwareInstructionToStage (
    authObject: IAddigyInternalAuthObject,
    instructionId: string
  ): Promise<object[]> {
    try {
      const res = await this._addigyRequest(
        'https://prod.addigy.com/copy_instruction_to_stage/',
        {
          headers: {
            Cookie: `auth_token=${authObject.authToken}`
          },
          method: 'POST',
          body: { instructionid: instructionId },
          json: true
        }
      )
      return res.body
    } catch (err) {
      throw err
    }
  }

  async updateSoftwareInstruction (
    authObject: IAddigyInternalAuthObject,
    postBody: object
  ): Promise<object[]> {
    try {
      const res = await this._addigyRequest(
        'https://app-prod.addigy.com/api/software/update_staged_instruction/',
        {
          headers: {
            Cookie: `auth_token=${authObject.authToken};`
          },
          method: 'POST',
          body: postBody,
          json: true
        }
      )
      return res.body
    } catch (err) {
      throw err
    }
  }

  async confirmSoftwareInstruction (
    authObject: IAddigyInternalAuthObject,
    instructionId: string
  ): Promise<object[]> {
    try {
      const res = await this._addigyRequest(
        `https://app-prod.addigy.com/api/software/confirm_staged_instruction?instructionid=${instructionId}`,
        {
          headers: {
            Cookie: `auth_token=${authObject.authToken};`
          },
          method: 'GET'
        }
      )
      return res.body
    } catch (err) {
      throw err
    }
  }

  async createSmartSoftware (authObject: IAddigyInternalAuthObject, baseIdentifier: string, version: string, downloads: string[], conditionScript: string, installationScript: string, removalScript: string, description?: string, profiles?: object, icon?: object): Promise<object> {
    const customSoftware: any = await this.createCustomSoftware(baseIdentifier, version, downloads, installationScript, conditionScript, removalScript)
    await this.copySoftwareInstructionToStage(authObject, customSoftware.instructionId)

    customSoftware.description = description
    if (typeof icon !== 'undefined') {
      customSoftware.icon = icon
    }

    if (typeof profiles !== 'undefined') {
      customSoftware.profiles = profiles
    }

    const updateSoftwareRes = await this.updateSoftwareInstruction(authObject, customSoftware)
    await this.confirmSoftwareInstruction(authObject, customSoftware.instructionId)
    return updateSoftwareRes
  }

  async createCustomSoftware (baseIdentifier: string, version: string, downloads: string[], installationScript: string, conditionScript: string, removalScript: string): Promise<object[]> {
    const postBody: any = {
      base_identifier: baseIdentifier,
      version: version,
      downloads: downloads,
      installation_script: installationScript,
      condition: conditionScript,
      remove_script: removalScript
    }

    try {
      const res = await this._addigyRequest(
        `${this.domain}/custom-software`,
        {
          headers: this.reqHeaders,
          method: 'POST',
          json: true,
          body: postBody
        }
      )
      // Fun fact! This endpoint returns an empty string when successful. Yes, that is correct, an empty string...
      return res.body
    } catch (err) {
      throw err
    }
  }

  //
  // The following endpoints use Addigy's internal API. Use at your own risk.
  //

  async getUsers (authObject: IAddigyInternalAuthObject): Promise<object[]> {
    try {
      const res = await this._addigyRequest(
        'https://app-prod.addigy.com/api/account',
        {
          headers: {
            Cookie: `auth_token=${authObject.authToken};`
          },
          method: 'GET'
        }
      )
      return JSON.parse(res.body).users
    } catch (err) {
      throw err
    }
  }

  async createUser (authObject: IAddigyInternalAuthObject, email: string, name: string, policies: string[] = [], role: UserRoles | string, phone?: string): Promise<object[]> {
    const postBody: any = {
      name: name,
      email: email,
      policies: policies,
      role: role
    }

    if (phone !== undefined) {
      postBody.phone = phone
    }

    try {
      const res = await this._addigyRequest(
        'https://app-prod.addigy.com/api/cloud/users/user',
        {
          headers: {
            Cookie: `auth_token=${authObject.authToken};`
          },
          method: 'POST',
          json: true,
          body: postBody
        }
      )
      return res.body
    } catch (err) {
      throw err
    }
  }

  async updateUser (authObject: IAddigyInternalAuthObject, email: string, name: string, policies: string[] = [], role: string, phone?: string): Promise<object[]> {
    const postBody: any = {
      id: '',
      uid: '', // this has to be blank on th PUT for some reason
      name: name,
      authanvil_tfa_username: '',
      email: email,
      phone: '',
      role: role,
      addigy_role: '', // this also has to be blank
      policies: policies
    }

    if (phone !== undefined) {
      postBody.phone = phone
    }

    try {
      // find userId that corresponds to the provided email
      const users: any[] = await this.getUsers(authObject)
      const user: any = users.find(element => element.email === email)
      if (!user) throw new Error(`No user with email ${email} exists.`)

      postBody.id = user.id // Addigy requires the user ID to be both in the post body and in the REST URI

      const res = await this._addigyRequest(
        `https://app-prod.addigy.com/api/cloud/users/user/${user.id}?user_email=${encodeURIComponent(user.email)}`,
        {
          headers: {
            Cookie: `auth_token=${authObject.authToken};`
          },
          method: 'PUT',
          json: true,
          body: postBody
        }
      )
      return res.body // returns `ok` if successful...
    } catch (err) {
      throw err
    }
  }

  async deleteUser (authObject: IAddigyInternalAuthObject, email: string): Promise<object[]> {
    try {
      // find userId that corresponds to the provided email
      const users: any[] = await this.getUsers(authObject)
      const user: any = users.find(element => element.email === email)
      if (!user) throw new Error(`No user with email ${email} exists.`)

      const res = await this._addigyRequest(
        `https://app-prod.addigy.com/api/cloud/users/user/${user.id}?user_email=${encodeURIComponent(email)}`,
        {
          headers: {
            Cookie: `auth_token=${authObject.authToken};`
          },
          method: 'DELETE'
        }
      )

      return JSON.parse(res.body) // this will return "ok" if successful.
    } catch (err) {
      throw err
    }
  }

  async getBillingData (authObject: IAddigyInternalAuthObject): Promise<object[]> {
    try {
      const res = await this._addigyRequest(
        'https://app-prod.addigy.com/api/billing/get_chargeover_billing_data',
        {
          headers: {
            Cookie: `auth_token=${authObject.authToken};`,
            email: authObject.emailAddress,
            orgid: authObject.orgId
          },
          method: 'GET'
        }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  async getApiIntegrations (authObject: IAddigyInternalAuthObject): Promise<object[]> {
    try {
      const res = await this._addigyRequest(
        'https://prod.addigy.com/accounts/api/keys/get/',
        {
          headers: {
            Cookie: `auth_token=${authObject.authToken};`,
            email: authObject.emailAddress,
            orgid: authObject.orgId
          },
          method: 'GET'
        }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  async createApiIntegration (authObject: IAddigyInternalAuthObject, name: string): Promise<object> {
    const postBody: any = {
      name
    }
    console.log(JSON.stringify(postBody))
    try {
      const res = await this._addigyRequest(
        'https://app-prod.addigy.com/api/integrations/keys',
        {
          headers: {
            Cookie: `auth_token=${authObject.authToken};`
          },
          method: 'POST',
          json: true,
          body: postBody
        }
      )
      return res.body
    } catch (err) {
      throw err
    }
  }

  async deleteApiIntegration (authObject: IAddigyInternalAuthObject, objectId: string): Promise<object> {
    try {
      const res = await this._addigyRequest(
        `https://app-prod.addigy.com/api/integrations/keys?id=${objectId}`,
        {
          headers: {
            Cookie: `auth_token=${authObject.authToken};`
          },
          method: 'DELETE'
        }
      )
      return res.body
    } catch (err) {
      throw err
    }
  }

  async getScreenconnectLinks (authObject: IAddigyInternalAuthObject, sessionId: string, agentId?: string): Promise<object[]> {
    // in most (all?) cases tested, the agentId and sessionId are identical, but they are independently passed in the API call
    agentId = agentId ?? sessionId

    const postBody = {
      sessionId: sessionId,
      agentid: agentId
    }

    try {
      const res = await this._addigyRequest(
        'https://app-prod.addigy.com/api/devices/screenconnect/links',
        {
          headers: {
            Cookie: `auth_token=${authObject.authToken};`,
            email: authObject.emailAddress,
            orgid: authObject.orgId
          },
          method: 'POST',
          json: true,
          body: postBody
        }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  async createKernelExtensionPolicy (authObject: IAddigyInternalAuthObject, name: string, allowOverrides: boolean = false, teamIds?: string[], bundleIds?: object): Promise<object> {
    const payload: any = {}
    const payloadUUID = uuidv4()
    const groupUUID = uuidv4()
    if (teamIds) {
      payload.allowed_team_identifiers = teamIds
    }
    if (bundleIds) {
      payload.allowed_kernel_extensions = bundleIds
    }
    const postBody = {
      payloads: [{
        addigy_payload_type: 'com.addigy.syspolicy.kernel-extension-policy.com.apple.syspolicy.kernel-extension-policy',
        payload_type: 'com.apple.syspolicy.kernel-extension-policy',
        payload_version: 1,
        payload_identifier: `com.addigy.syspolicy.kernel-extension-policy.com.apple.syspolicy.kernel-extension-policy.${groupUUID}`,
        payload_uuid: payloadUUID,
        payload_group_id: groupUUID,
        payload_enabled: true,
        payload_display_name: name,
        allow_user_overrides: allowOverrides,
        ...payload
      }]
    }

    try {
      const res = await this._addigyRequest(
        'https://app-prod.addigy.com/api/mdm/user/profiles/configurations',
        {
          headers: {
            Cookie: `auth_token=${authObject.authToken};`
          },
          method: 'POST',
          json: true,
          body: postBody
        }
      )
      return res.body
    } catch (err) {
      throw err
    }
  }

  async getFileVaultKeys (authObject: IAddigyInternalAuthObject): Promise<object[]> {
    try {
      const res = await this._addigyRequest(
        'https://prod.addigy.com/get_org_filevault_keys/',
        {
          headers: {
            Cookie: `auth_token=${authObject.authToken};`
          },
          method: 'GET'
        }
      )
      return JSON.parse(res.body)
    } catch (err) {
      throw err
    }
  }

  async getApnsCerts (authObject: IAddigyInternalAuthObject, next?: string, previous?: string): Promise<object[]> {
    let url = 'https://app-prod.addigy.com/api/apn/user/apn/list'
    if (next) {
      url = `${url}?next=${next}`
    }
    if (previous) {
      url = `${url}?previous=${previous}`
    }

    try {
      const res = await this._addigyRequest(
        url,
        {
          headers: {
            Cookie: `auth_token=${authObject.authToken};`,
            email: authObject.emailAddress,
            orgid: authObject.orgId
          },
          method: 'GET'
        }
      )
      return JSON.parse(res.body).mdm_app_list
    } catch (err) {
      throw err
    }
  }

  async getAuthObject (): Promise<IAddigyInternalAuthObject> {
    const postBody: any = {
      username: this.config.adminUsername,
      password: this.config.adminPassword
    }

    try {
      if (typeof this.config.adminUsername === 'undefined' || typeof this.config.adminPassword === 'undefined') throw new Error('The function you are using hits Addigy\'s internal API, but no username or password was provided in the constructor. Please fill out the adminUsername and adminPassword parameters.')
      const res = await this._addigyRequest(
        'https://prod.addigy.com/signin/',
        {
          method: 'POST',
          json: true,
          body: postBody
        }
      )

      const authObject = {
        orgId: res.body.orgid,
        authToken: res.body.authtoken,
        emailAddress: res.body.email
      }

      return authObject
    } catch (err) {
      throw err
    }
  }

  async getImpersonationAuthObject (authObject: IAddigyInternalAuthObject, orgId: string): Promise<IAddigyInternalAuthObject> {
    const postBody: any = {
      orgid: orgId
    }

    try {
      const res = await this._addigyRequest(
        'https://prod.addigy.com/impersonate_org/',
        {
          headers: {
            Cookie: `auth_token=${authObject.authToken};`
          },
          method: 'GET',
          json: true,
          body: postBody
        }
      )

      const impersonationAuthObject = {
        orgId: orgId,
        authToken: res.headers['set-cookie'].find((e: string) => e.includes('auth_token') && !e.includes('original_auth_token')).split('auth_token=')[1].split(';')[0],
        emailAddress: authObject.emailAddress
      }

      return impersonationAuthObject
    } catch (err) {
      throw err
    }
  }

  private async _addigyRequest (url: string, options: any): Promise<any> {
    try {
      const res = await got(url, options)
      return res
    } catch (err) {
      throw err
    }
  }
}

export = Addigy
