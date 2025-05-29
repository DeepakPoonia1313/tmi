import React from 'react';

const ListComponent = (props) => {
    const {
        records = [], // default to empty array if undefined
        resource,
        action,
        filter,
        sort,
        direction,
    } = props;

    console.log("== Region ListComponent ==");
    console.log("These are the props => ", props)
    records.forEach((record, index) => {
        console.log(`Record ${index + 1}:`, record?.params);
    });

    return (
        <div>
            <h2>This is the list component</h2>
            <ul>
                {records.map((record) => (
                    <li key={record.id}>
                        <strong>{record.params?.name}</strong><br />
                        {record.params?.description}<br />
                        <em>Created: {record.params?.created_at}</em>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ListComponent;
