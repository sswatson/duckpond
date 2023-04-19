import React from 'react';
import { Table } from 'apache-arrow';

export default function ArrowTable({ table }: { table: Table }) {
  // Extract column names
  const columnNames = table.schema.fields.map(field => field.name);

  const columns = new Map();

  for (const columnName of columnNames) {
    columns.set(
      columnName,
      [...(table.getChild(columnName) || [])]
    );
  }

  // Extract rows data
  const rows = [];
  for (let i = 0; i < Math.min(1000, table.numRows); i++) {
    const row = [];
    for (const columnName of columnNames) {
      row.push(columns.get(columnName).at(i));
    }
    rows.push(row);
  }

  return (
    <table>
      <thead>
        <tr>
          {columnNames.map((columnName, index) => (
            <th key={index}>{columnName}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>{cell || cell === 0 || cell === 0n ? cell.toString() : ""}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
