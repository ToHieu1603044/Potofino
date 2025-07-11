export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype); 
    this.name = this.constructor.name;   
  }
}
