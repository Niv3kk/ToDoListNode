const categoryDecorator = (category) => {
    return {
        id: category.id,
        name: category.name,
        user_id: category.user_id,
    };
};


const categoriesDecorator = (categories) => {
    return categories.map(categoryDecorator);
};


export {
    categoryDecorator,
    categoriesDecorator,
};