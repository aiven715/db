import { BehaviorSubject } from "rxjs";

export class State {
  private subject = new BehaviorSubject(null);

  get stream() {
    return this.subject.asObservable();
  }

  ping() {
    this.subject.next(null);
  }
}
