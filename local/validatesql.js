export default function validateSQL(sql, question) {

    const q = question.toLowerCase();

    const isCountQuestion =
        q.includes("how many") ||
        q.includes("count") ||
        q.includes("number of");

    // Remove dangerous statements
    if (/(insert|update|delete|drop|alter|truncate)/i.test(sql)) {
        throw new Error("Dangerous query blocked.");
    }

    // Fix GROUP BY mistakes automatically
    if (isCountQuestion) {

        // remove accidental column selections
        sql = sql.replace(/select\s+(.+)\s+from/i, (match, fields) => {
            return "SELECT COUNT(*) FROM";
        });

        // remove GROUP BY if exists
        sql = sql.replace(/group by[\s\S]*/i, "");

    }

    return sql.trim();
}
