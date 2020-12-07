import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdvanceRequestPolicyService {

  constructor(
    private httpClient: HttpClient
  ) { }

  getPolicyRules(result) {
    return result.advance_request_policy_rule_desired_states.filter((desiredState) =>  {
      return desiredState.popup === true;
    }).map((desiredState) => {
      return desiredState.description;
    });
  }

  servicePost(url, data, config) {
    return this.httpClient.post(environment.ROOT_URL + '/policy/advance_requests' + url, data);
  }


}
