import React from 'react'
import ReactDOM from 'react-dom'
import client from './client'
import follow from './follow'
import './App.css'

export default class App extends React.Component {

    // root = 'http://192.168.0.58:8080/api';
    root = "http://localhost:8080/api";

    constructor(props) {
        super(props);
        this.state = {records: [], attributes: [], pageSize: 2, links: {}};
        this.updatePageSize = this.updatePageSize.bind(this);
        this.onCreate = this.onCreate.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
        this.onNavigate = this.onNavigate.bind(this);
    }

    componentDidMount() {
        this.loadFromServer(this.state.pageSize);
    }

    onUpdate(record, updatedRecord) {
        fetch(record._links.self.href, {
                method: 'PUT',
                entity: updatedRecord,
                header: {
                    'Content-Type': 'application/json'
                }
        }).then(response =>{
                console.log(response);
                return response;
            }
        );

        // client({
        //     method: 'PUT',
        //     path: record._links.self.href,
        //     entity: updatedRecord,
        //     header: {
        //         'Content-Type': 'application/json'
        //     }
        // }).then(response =>{
        //         console.log(response);
        //         return response;
        //     }
        // );
    }


    onCreate(newRecord) {
        follow(client, this.root, ['records'])
            .then(recordCollection => {
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

        let url = new URL(this.root + "/records"),
            params = {size: pageSize};
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        fetch(url, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        }).then(res => {
            let response = res.json();
            return response;
        }).then(response => {
            let profileLink = response._links.profile.href;
            let attributes = null;
            fetch(profileLink).then
            (res => {
                let responseOfProfileLink = res.json();
                return responseOfProfileLink;
            }).then(responseOfProfileLink => {
                let descriptors = responseOfProfileLink.alps.descriptors[0].descriptors;
                let attributeAmount = descriptors.length;
                attributes = Array(attributeAmount).fill(null);
                for (let i = 0; i < attributeAmount; i++) {
                    attributes[i] = descriptors[i].name;
                }
                this.setState({
                    records: response._embedded.records,
                    pageSize: pageSize,
                    links: response._links,
                    attributes: attributes,
                })
            });

        });
    }

    render() {
        return (
            <div>
                <CreateDialog attributes={this.state.attributes} onCreate={this.onCreate}/>
                <RecordList records={this.state.records}
                            links={this.state.links}
                            pageSize={this.state.pageSize}
                            attributes={this.state.attributes}
                            onNavigate={this.onNavigate}
                            onDelete={this.onDelete}
                            onUpdate={this.onUpdate}
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
                <input type="text" placeholder={attribute} ref={attribute} className="field"/>
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

    handleNavFirst(e) {
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
            <Record key={record._links.self.href} attributes={this.props.attributes} record={record} onDelete={this.props.onDelete} onUpdate={this.props.onUpdate}/>
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
                        <th>UserName</th>
                        <th>DateTime</th>
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

class UpdateDialog extends React.Component {

    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(e) {
        e.preventDefault();
        let updatedRecord = {};
        this.props.attributes.forEach(attribute => {
            updatedRecord[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
        });
        this.props.onUpdate(this.props.record, updatedRecord);
        window.location = "#window_locaiton_2";
    }

    render() {

        let inputs = this.props.attributes.map(attribute =>
            <p key={this.props.record[attribute]}>
                <input type={'text'} placeholder={attribute}
                       defaultValue={this.props.record[attribute]}
                       ref={attribute} className={'field'}/>
            </p>
        );


        let dialogId = 'updateRecord' + this.props.record._links.self.href;

        return (
            <div key={this.props.record._links.self.href}>
                <a href={"#" + dialogId}>Update</a>
                <div id={dialogId} className={"modalDialog"}>
                    <div>
                        <a href={'#window_locaiton_2'} title="Close">X</a>

                        <h2>Update an record</h2>

                        <form>
                            {inputs}
                            <button onClick={this.handleSubmit}>Update</button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }
}


class Record extends React.Component {

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
                <td>{this.props.record.dateTimeOfTheEvent}</td>
                <td>{this.props.record.descriptionOfTheEvent}</td>
                <td>
                    <UpdateDialog record={this.props.record} attributes={this.props.attributes} onUpdate={this.props.onUpdate}/>
                </td>
                <td>
                    <button onClick={this.handleDelete}>Delete</button>
                </td>
            </tr>);
    }
}


