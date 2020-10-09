import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MyViewAdvanceRequestPageRoutingModule } from './my-view-advance-request-routing.module';

import { MyViewAdvanceRequestPage } from './my-view-advance-request.page';
import { MatIconModule } from '@angular/material/icon';
import { SharedModule } from 'src/app/shared/shared.module';
import { PullBackAdvanceRequestComponent } from './pull-back-advance-request/pull-back-advance-request.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MyViewAdvanceRequestPageRoutingModule,
    MatIconModule,
    SharedModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  declarations: [
    MyViewAdvanceRequestPage,
    PullBackAdvanceRequestComponent 
  ]
})
export class MyViewAdvanceRequestPageModule {}
