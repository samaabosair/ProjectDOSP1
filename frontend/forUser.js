const readline = require('readline');
const axios = require('axios');

const CATALOG_URL = 'http://localhost:5000';
const ORDER_URL = 'http://localhost:5001';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function showMenu() {
    console.log('\n Welcome to  Book Purchase System');
    console.log('1. Search for books by topic');
    console.log('2. Get info about a book by ID');
    console.log('3. Purchase a book by ID');
    console.log('4. Exit');
    rl.question('\n Enter your choice: ', handleSelect);
}

async function handleSelect(choice) {
    switch (choice.trim()) {
        case '1':
            rl.question('Enter the topic to search: ', async (topic) => {
                try {
                    const { data } = await axios.get(`${CATALOG_URL}/search/${topic}`);
                    console.log('\n Search Results:');
                    data.forEach(book => {
                        console.log(`- [${book.id}] ${book.title} (Topic: ${book.topic}, Quantity: ${book.quantity})`);
                    });
                } catch (err) {
                    console.error(' Failed to fetch search results:', err.message);
                }
                showMenu();
            });
            break;

        case '2':
            rl.question('Enter book ID: ', async (id) => {
                try {
                    const { data } = await axios.get(`${CATALOG_URL}/info/${id}`);
                    console.log(`\n Info for Book ID ${id}:\nTitle: ${data.title}\nTopic: ${data.topic}\nQuantity: ${data.quantity}`);
                } catch (err) {
                    console.error(' Failed to fetch book info:', err.message);
                }
                showMenu();
            });
            break;

        case '3':
            rl.question('Enter book ID to purchase: ', async (id) => {
                try {
                    const { data } = await axios.post(`${ORDER_URL}/purchase/${id}`);
                    console.log('\n Purchase Successful!');
                    console.log(`The Order Info:\n- ID: ${data.order.id}\n- Title: ${data.order.title}\n- Time: ${data.order.time}`);
                } catch (err) {
                    if (err.response && err.response.data) {
                        console.error(' Purchase Failed:', err.response.data.error);
                    } else {
                        console.error(' Error:', err.message);
                    }
                }
                showMenu();
            });
            break;

        case '4':
            console.log('Exiting.!');
            rl.close();
            break;

        default:
            console.log('Invalid choice, try again.');
            showMenu();
            break;
    }
}

showMenu();
