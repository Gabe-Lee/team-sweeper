import React from 'react';

export default class extends React.Component {
  constructor() {
    super();
    this.state = {
      board: [],
      flags: [],
      mines: 0,
      timer: 0,
      status: 0
    };
  }

  render() {
    return (
      <div>
        App
      </div>
    );
  }
}
