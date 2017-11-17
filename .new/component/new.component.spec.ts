import { browser } from 'protractor';
import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { Component, ElementRef } from "@angular/core";
import { By } from '@angular/platform-browser';

import { NewComponent } from './new.component';

describe('NewComponent', () => {

  let fixture: ComponentFixture<NewComponent>;
  let component: NewComponent;

  beforeEach(async(() => {

    TestBed.configureTestingModule({
      declarations: [
        NewComponent
      ],
    }).compileComponents();

  }));

  beforeEach(() => {

    fixture = TestBed.createComponent(NewComponent);
    component = fixture.componentInstance;

  });

  it('should create the component', async(() => {

    expect(component).toBeTruthy();

  }));


});