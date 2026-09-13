const statusTasks = Object.freeze({
    PENDING: false,
    COMPLETED: true,
});

const isValidTaskStatus = (value) => {
    return Object.values(statusTasks).includes(value);
};

export {
    statusTasks,
    isValidTaskStatus,
};