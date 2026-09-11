const taskDecorator = (task) => {
    return {
        id: task.id,
        title: task.title,
        description: task.description,
        is_completed: Boolean(task.is_completed),
        category: {
            id: task.category_id,
            name: task.category_name ?? null,
        },
        user_id: task.user_id,
        tags: task.tags ?? [],
    };
};


const tasksDecorator = (
    tasks,
    categories = [],
    tags = []
) => {
    const categoriesById = new Map(
        categories.map((category) => [
            category.id,
            category.name,
        ])
    );

    const tagsByTaskId = new Map();

    for (const tag of tags) {
        const taskTags =
            tagsByTaskId.get(tag.task_id) ?? [];

        taskTags.push({
            id: tag.id,
            name: tag.name,
        });

        tagsByTaskId.set(
            tag.task_id,
            taskTags
        );
    }

    return tasks.map((task) =>
        taskDecorator({
            ...task,
            category_name:
                categoriesById.get(
                    task.category_id
                ) ?? null,
            tags:
                tagsByTaskId.get(task.id) ??
                [],
        })
    );
};


export {
    taskDecorator,
    tasksDecorator,
};