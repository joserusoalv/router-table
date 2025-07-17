import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { Counter } from './counter';

describe('Counter (template)', () => {
  let fixture: ComponentFixture<Counter>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Counter],
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(Counter);
    fixture.detectChanges();
  });

  it('should render initial count as 0', () => {
    const h2 = fixture.nativeElement.querySelector('h2');
    expect(h2.textContent).toContain('Contador: 0');
  });

  it('should increment the count when "+" is clicked', () => {
    const incBtn = fixture.debugElement.query(
      By.css('button:last-child')
    ).nativeElement;
    incBtn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h2').textContent).toContain(
      'Contador: 1'
    );
    incBtn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h2').textContent).toContain(
      'Contador: 2'
    );
  });

  it('should decrement the count when "-" is clicked', () => {
    const incBtn = fixture.debugElement.query(
      By.css('button:last-child')
    ).nativeElement;
    const decBtn = fixture.debugElement.query(
      By.css('button:first-child')
    ).nativeElement;
    incBtn.click();
    incBtn.click();
    fixture.detectChanges();
    decBtn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h2').textContent).toContain(
      'Contador: 1'
    );
    decBtn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h2').textContent).toContain(
      'Contador: 0'
    );
  });

  it('should reset the count when "Reset" is clicked', () => {
    const incBtn = fixture.debugElement.query(
      By.css('button:last-child')
    ).nativeElement;
    const resetBtn = fixture.debugElement.query(
      By.css('button:nth-child(2)')
    ).nativeElement;
    incBtn.click();
    incBtn.click();
    fixture.detectChanges();
    resetBtn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h2').textContent).toContain(
      'Contador: 0'
    );
  });
});
