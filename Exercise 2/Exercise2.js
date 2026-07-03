const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './exercise2_db.sqlite',
  logging: false
});

const Author = sequelize.define('Author', {
  name: { type: DataTypes.STRING, allowNull: false },
  birthYear: { type: DataTypes.INTEGER }
});

const Book = sequelize.define('Book', {
  title: { type: DataTypes.STRING, allowNull: false },
  publicationYear: { type: DataTypes.INTEGER },
  pages: { type: DataTypes.INTEGER }
});

Author.hasMany(Book, { onDelete: 'CASCADE' });
Book.belongsTo(Author);

async function run() {
  try {
    await sequelize.sync({ force: true });
    console.log(" Database synced successfully!\n");

    const ronan = await Author.create({ name: 'Ronan The Best', birthYear: 1990 });
    const kim = await Author.create({ name: 'Kim Ang', birthYear: 1995 });
    const hok = await Author.create({ name: 'Hok Tim', birthYear: 2015 });

    await ronan.createBook({ title: 'Coding 101', publicationYear: 2015, pages: 250 });
    await ronan.createBook({ title: 'Advanced JS', publicationYear: 2020, pages: 400 });

    await kim.createBook({ title: 'Data Structures Guide', publicationYear: 2018, pages: 320 });
    await kim.createBook({ title: 'UI Design Patterns', publicationYear: 2022, pages: 180 });

    await hok.createBook({ title: 'Playground Logic', publicationYear: 2025, pages: 50 });
    await hok.createBook({ title: 'Algorithms for Kids', publicationYear: 2026, pages: 95 });

    console.log(" Sample data seeded successfully!\n");

    console.log("--- Query 1: Fetching all books by Ronan The Best ---");
    const ronanBooks = await Book.findAll({ where: { AuthorId: ronan.id } });
    ronanBooks.forEach(book => {
      console.log(`- ${book.title} (${book.publicationYear}), ${book.pages} pages`);
    });
    console.log("\n");

    console.log("--- Query 2: Creating a new book for Kim Ang using .createBook() ---");
    const newBook = await kim.createBook({ title: 'Mastering Sequelize', publicationYear: 2026, pages: 300 });
    console.log(`Successfully added: "${newBook.title}" linked to AuthorId: ${newBook.AuthorId}\n`);

    console.log("--- Query 3: Listing all authors along with their books ---");
    const authorsWithBooks = await Author.findAll({ include: Book });
    authorsWithBooks.forEach(author => {
      console.log(`Author: ${author.name} (Born: ${author.birthYear})`);
      if (author.Books) {
        author.Books.forEach(book => {
          console.log(` Book: ${book.title} | Year: ${book.publicationYear} | Pages: ${book.pages}`);
        });
      }
    });

  } catch (error) {
    console.error(" Error running exercise:", error);
  } finally {
    await sequelize.close();
  }
}

run();