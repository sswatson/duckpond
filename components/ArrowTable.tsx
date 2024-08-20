import React from "react";
import { Table } from "apache-arrow";

export default function ArrowTable({ table }: { table: Table }) {
  const columnNames = table.schema.fields.map((field) => field.name);
  const columns = new Map();
  for (const columnName of columnNames) {
    columns.set(columnName, [...(table.getChild(columnName) || [])]);
  }

  const rows = [];
  for (let i = 0; i < Math.min(1000, table.numRows); i++) {
    const row = [];
    for (const columnName of columnNames) {
      row.push(columns.get(columnName).at(i));
    }
    rows.push(row);
  }

  const types = table.schema.fields.map((field) => field.type);

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
              <td key={cellIndex}>{toString(types[cellIndex], cell)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function toString(type: any, value: any) {
  if (value === 0 || value === 0n) return "0";
  if (value === false) return "false";
  if (!value) return "";
  if (type.constructor.name === "Decimal") {
    if (type.constructor.name === 'Decimal') {
      const scale = type.scale;

      // Combine the Uint32Array into a 128-bit integer
      let highBits = BigInt(value[3]) << 96n |
                     BigInt(value[2]) << 64n |
                     BigInt(value[1]) << 32n |
                     BigInt(value[0]);

      // Check if the number is negative
      const isNegative = (value[3] & 0x80000000) !== 0;

      if (isNegative) {
          // Convert from two's complement to positive magnitude
          const maxValue = BigInt(1) << 128n; // 2^128
          highBits = maxValue - highBits;
          highBits = -highBits;
      }

      // Apply the scale to get the correct decimal value
      const decimalValue = highBits / BigInt(10 ** scale);

      // Convert the result to a string
      return decimalValue.toString();
  }
  }
  return value.toString();
}
