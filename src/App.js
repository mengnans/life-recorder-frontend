
import React from 'react'
import client from './client'

export default class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {records: []};
    }

    componentDidMount() {
        client({method: 'GET', path: 'http://localhost:8080/api/records'}).then(response => {
            this.setState({records: response.entity._embedded.records});
        });
    }

    render() {
        return (
            <RecordList records={this.state.records}/>
        )
    }
    //
    // loadFromServer(pageSize) {
    //     follow(client, root, [
    //         {rel: 'employees', params: {size: pageSize}}]
    //     ).then(employeeCollection => {
    //         return client({
    //             method: 'GET',
    //             path: employeeCollection.entity._links.profile.href,
    //             headers: {'Accept': 'application/schema+json'}
    //         }).then(schema => {
    //             this.schema = schema.entity;
    //             return employeeCollection;
    //         });
    //     }).done(employeeCollection => {
    //         this.setState({
    //             employees: employeeCollection.entity._embedded.employees,
    //             attributes: Object.keys(this.schema.properties),
    //             pageSize: pageSize,
    //             links: employeeCollection.entity._links});
    //     });
    // }
}

class RecordList extends React.Component{
    render() {
        let records = this.props.records.map(record =>
            <Record key={record._links.self.href} record={record}/>
        );
        return (
            <table>
                <tbody>
                <tr>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Description</th>
                </tr>
                {records}
                </tbody>
            </table>
        )
    }
}

class Record extends React.Component{
    render() {
        return (
            <tr>
                <td>{this.props.record.userName}</td>
                <td>{this.props.record.dateTime}</td>
                <td>{this.props.record.description}</td>
            </tr>
        )
    }
}
