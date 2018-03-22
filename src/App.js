import React, { Component } from 'react';
import './App.css';

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            error: null,
            isLoaded: false,
            records: []
        };
    }

    componentDidMount() {
        fetch("http://localhost:8080/api/records")
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        isLoaded: true,
                        records: result._embedded.records
                    });
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (error) => {
                    this.setState({
                        isLoaded: true,
                        error
                    });
                }
            )
    }

  render() {
      const { error, isLoaded, records } = this.state;
      if (error) {
          return <div>Error: {error.message}</div>;
      } else if (!isLoaded) {
          return <div>Loading...</div>;
      } else {
          return (
              <ul>
                  {records.map(record => (
                      <li key={record.id}>
                          {record.id} {record.userName} {record.dateTime} {record.description}
                      </li>
                  ))}
              </ul>
          );
      }
  }
}

export default App;
