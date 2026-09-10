const tagDecorator = (tag) => {
    return {
        id: tag.id,
        name: tag.name,
        user_id: tag.user_id,
    };
};


const tagsDecorator = (tags) => {
    return tags.map(tagDecorator);
};


export {
    tagDecorator,
    tagsDecorator,
};