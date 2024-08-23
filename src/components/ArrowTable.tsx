import { DataType, Table } from "apache-arrow";

export default function ArrowTable({
  table,
  rowLimit,
  incrementRowLimit
}: {
  table: Table;
  rowLimit: number;
  incrementRowLimit: () => void;
}) {
  const columnNames = table.schema.fields.map((field) => field.name);
  const columns = new Map();
  for (const columnName of columnNames) {
    columns.set(columnName, [...(table.getChild(columnName) || [])]);
  }

  const rows = [];
  for (let i = 0; i < Math.min(rowLimit, table.numRows); i++) {
    const row = [];
    for (const columnName of columnNames) {
      row.push(columns.get(columnName).at(i));
    }
    rows.push(row);
  }
  if (table.numRows > rowLimit) {
    rows.push(Array.from({ length: columnNames.length }, () => "⋮"));
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
            {row.map((cell, cellIndex) =>
              cell === "⋮" ? (
                <td
                  className="show-more"
                  key={cellIndex}
                  onClick={incrementRowLimit}
                >
                  {cell}
                </td>
              ) : (
                <td key={cellIndex}>{toString(types[cellIndex], cell)}</td>
              )
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function toString(type: DataType, value: unknown) {
  if (value === 0 || value === 0n) return "0";
  if (value === false) return "false";
  if (!value) return "";
  if (!type || !type?.constructor || !type?.constructor?.name)
    return value.toString();
  if (type.constructor.name === "Decimal") {
    if (type.constructor.name === "Decimal") {
      const scale = (type as DataType & { scale: number }).scale;

      if (Array.isArray(value) && value.length === 4) {
        // Combine the Uint32Array into a 128-bit integer
        let highBits =
          (BigInt(value[3]) << 96n) |
          (BigInt(value[2]) << 64n) |
          (BigInt(value[1]) << 32n) |
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
      } else {
        return value.toString();
      }
    }
  }
  return value.toString();
}
