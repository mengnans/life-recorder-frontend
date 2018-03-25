
import React from 'react'
import ReactDOM from 'react-dom'
import client from './client'
import follow from './follow'
import './App.css'

export default class App extends React.Component {

    // root = 'http://192.168.0.58:8080/api';
    root = "http://localhost:8080/api"

    constructor(props) {
        super(props);
        this.state = {records: [], attributes: [], pageSize: 2, links: {}};
        this.updatePageSize = this.updatePageSize.bind(this);
        this.onCreate = this.onCreate.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onNavigate = this.onNavigate.bind(this);
    }

    componentDidMount() {
        this.loadFromServer(this.state.pageSize);
    }

    onCreate(newRecord) {
        follow(client, this.root, ['records']).then(recordCollection => {
            return client({
                method: 'POST',
                path: recordCollection.entity._links.self.href,
                entity: newRecord,
                headers: {'Content-Type': 'application/json'}
            })
        }).then(response => {
            return follow(client, this.root, [
                {rel: 'records', params: {'size': this.state.pageSize}}]);
        }).then(response => {
            if (typeof response.entity._links.last !== "undefined") {
                this.onNavigate(response.entity._links.last.href);
            } else {
                this.onNavigate(response.entity._links.self.href);
            }
        });
    }

    onDelete(record) {
        client({method: 'DELETE', path: record._links.self.href}).then(response => {
            this.loadFromServer(this.state.pageSize);
        });
    }

    onNavigate(navUri) {
        client({method: 'GET', path: navUri}).then(recordCollection => {
            this.setState({
                records: recordCollection.entity._embedded.records,
                attributes: this.state.attributes,
                pageSize: this.state.pageSize,
                links: recordCollection.entity._links
            });
        });
    }

    updatePageSize(pageSize) {
        if (pageSize !== this.state.pageSize) {
            this.loadFromServer(pageSize);
        }
    }

    loadFromServer(pageSize) {
        follow(client, this.root, [
            {rel: 'records', params: {size: pageSize}}]
        ).then(recordsCollection => {
            return client({
                method: 'GET',
                path: recordsCollection.entity._links.profile.href,
                headers: {'Accept': 'application/schema+json'}
            }).then(schema => {
                this.schema = schema.entity;
                return recordsCollection;
            });
        }).then(recordsCollection => {
            this.setState({
                records: recordsCollection.entity._embedded.records,
                attributes: Object.keys(this.schema.properties),
                pageSize: pageSize,
                links: recordsCollection.entity._links});
        });
    }

    render() {
        return (
            <div>
                <CreateDialog attributes={this.state.attributes} onCreate={this.onCreate}/>
                <RecordList records={this.state.records}
                              links={this.state.links}
                              pageSize={this.state.pageSize}
                              onNavigate={this.onNavigate}
                              onDelete={this.onDelete}
                              updatePageSize={this.updatePageSize}/>
            </div>
        )
    }

}

class CreateDialog extends React.Component {

    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(e) {
        e.preventDefault();
        let newRecord = {};
        this.props.attributes.forEach(attribute => {
            newRecord[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
        });
        this.props.onCreate(newRecord);

        // clear out the dialog's inputs
        this.props.attributes.forEach(attribute => {
            ReactDOM.findDOMNode(this.refs[attribute]).value = '';
        });

        // Navigate away from the dialog to hide it.
        window.location = "#window-location";
    }

    render() {
        let inputs = this.props.attributes.map(attribute =>
            <p key={attribute}>
                <input type="text" placeholder={attribute} ref={attribute} className="field" />
            </p>
        );

        return (
            <div>
                <a href="#createRecord">Create</a>

                <div id="createRecord" className="modalDialog">
                    <div>
                        <a href="#window-location" title="Close" className="close">X</a>

                        <h2>Create new record</h2>

                        <form>
                            {inputs}
                            <button onClick={this.handleSubmit}>Create</button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

}

class RecordList extends React.Component {

    constructor(props) {
        super(props);
        this.handleNavFirst = this.handleNavFirst.bind(this);
        this.handleNavPrev = this.handleNavPrev.bind(this);
        this.handleNavNext = this.handleNavNext.bind(this);
        this.handleNavLast = this.handleNavLast.bind(this);
        this.handleInput = this.handleInput.bind(this);
    }

    handleInput(e) {
        e.preventDefault();
        let pageSize = ReactDOM.findDOMNode(this.refs.pageSize).value;
        if (/^[0-9]+$/.test(pageSize)) {
            this.props.updatePageSize(pageSize);
        } else {
            ReactDOM.findDOMNode(this.refs.pageSize).value =
                pageSize.substring(0, pageSize.length - 1);
        }
    }

    handleNavFirst(e){
        e.preventDefault();
        this.props.onNavigate(this.props.links.first.href);
    }

    handleNavPrev(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.prev.href);
    }

    handleNavNext(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.next.href);
    }

    handleNavLast(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.last.href);
    }

    render() {
        let records = this.props.records.map(record =>
            <Record key={record._links.self.href} record={record} onDelete={this.props.onDelete}/>
        );

        let navLinks = [];
        if ("first" in this.props.links) {
            navLinks.push(<button key="first" onClick={this.handleNavFirst}>&lt;&lt;</button>);
        }
        if ("prev" in this.props.links) {
            navLinks.push(<button key="prev" onClick={this.handleNavPrev}>&lt;</button>);
        }
        if ("next" in this.props.links) {
            navLinks.push(<button key="next" onClick={this.handleNavNext}>&gt;</button>);
        }
        if ("last" in this.props.links) {
            navLinks.push(<button key="last" onClick={this.handleNavLast}>&gt;&gt;</button>);
        }

        return (
            <div>
                <input ref="pageSize" defaultValue={this.props.pageSize} onInput={this.handleInput}/>
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
                <div>
                    {navLinks}
                </div>
            </div>
        )
    }
}

class Record extends React.Component{

    constructor(props) {
        super(props);
        this.handleDelete = this.handleDelete.bind(this);
    }

    handleDelete() {
        this.props.onDelete(this.props.record);
    }

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
