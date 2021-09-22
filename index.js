const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const validator = require("email-validator");
const bcrypt = require("bcrypt");
const saltRounds = 15;
require("dotenv").config();


const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nbey4.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.listen(process.env.PORT || 5000, () => console.log("Listening to port 5000"));

client.connect((err) => {
	const categoryCollection = client.db("PureCareBD").collection("Categories");
	const adminCollection = client.db("PureCareBD").collection("Admin");
	const productCollection = client.db("PureCareBD").collection("Products");
	const orderCollection = client.db("PureCareBD").collection("Orders");
	const userCollection = client.db("PureCareBD").collection("Users");

	app.post("/addCategory", (req, res) => {
		const categoryAdd = req.body;
		const categoryName = req.body.category;
		categoryCollection
			.find({ category: categoryName })
			.toArray((err, documents) => {
				if (documents.length == 0) {
					categoryCollection.insertOne(categoryAdd).then((result) => {
						res.send(result.insertedCount > 0);
					});
				} else {
					res.send(false);
				}
			});
	});

	app.get("/categories", (req, res) => {
		categoryCollection.find().toArray((err, documents) => {
			res.send(documents);
		});
	});

	app.get("/products", (req, res) => {
		productCollection.find().toArray((err, documents) => {
			res.send(documents);
		});
	});

	app.get("/orders", (req, res) => {
		orderCollection.find().toArray((err, documents) => {
			res.send(documents);
		});
	});

	app.post("/categories/:selectedCategory", (req, res) => {
		const key = req.params.selectedCategory;
		categoryCollection.find({ category: key }).toArray((err, documents) => {
			res.send(documents);
		});
	});

	app.get("/order/:id", (req, res) => {
		const key = req.params.id;
		orderCollection.find({ _id: ObjectId(key) })
			.toArray((err, documents) => {
				res.send(documents);
			});
	});

	app.delete("/deleteCategory/:key", (req, res) => {
		categoryCollection
			.deleteOne({ _id: ObjectId(req.params.key) })
			.then((result) => {
				res.send(result.deletedCount > 0);
			});
	});

	app.delete("/deleteOrder/:key", (req, res) => {
		orderCollection
			.deleteOne({ _id: ObjectId(req.params.key) })
			.then((result) => {
				res.send(result.deletedCount > 0);
			});
	});

	app.patch("/updateProduct/:id", (req, res) => {
		productCollection
			.updateOne(
				{ _id: ObjectId(req.params.id) },
				{
					$set: {
						ProductName: req.body.ProductName,
						ProductPrice: req.body.ProductPrice,
						ProductAvailability: req.body.ProductAvailability,
						ProductCategory: req.body.ProductCategory,
						ProductSubCategory: req.body.ProductSubCategory,
						ProductDetails: req.body.ProductDetails,
						ProductUsage: req.body.ProductUsage,
						ProductImage: req.body.ProductImage,
					},
				}
			)
			.then((result) => {
				res.send(result.modifiedCount > 0);
			});
	});

	app.patch('/updateAdmin', (req, res) => {
		const OldPass = req.body.OldPass;
		const NewPass = req.body.NewPass;
		adminCollection.find({ Email: req.body.Email })
			.toArray((err, documents) => {
				const adminDetails = documents[0];
				if (documents.length !== 0) {
					bcrypt.compare(OldPass, adminDetails.Password, function (err, result) {

						if (result) {
							adminCollection
								.updateOne(
									{ Email: req.body.Email },
									{
										$set: {
											Password: NewPass
										},
									}
								)
								.then((result) => {
									res.send(result.modifiedCount > 0);
								});
						}
						else {
							res.send(false)
						}
					});
				}
				else {
					res.send(false)
				}
			})

	})

	app.delete("/deleteProduct/:productId", (req, res) => {
		productCollection
			.deleteOne({ _id: ObjectId(req.params.productId) })
			.then((result) => {
				res.send(result.deletedCount > 0);
			});
	});

	app.post("/addAdmin", (req, res) => {
		const addAdmin = req.body;
		const adminEmail = req.body.Email;
		const Password = req.body.Password;
		if (validator.validate(adminEmail)) {
			adminCollection
				.find({ Email: adminEmail })
				.toArray((err, documents) => {
					if (documents.length == 0) {
						bcrypt.hash(Password, saltRounds, function (err, hash) {
							addAdmin.Password = hash;
							adminCollection.insertOne(addAdmin).then((result) => {
								res.send(result.insertedCount > 0);
							});

						});

					} else {
						res.send(false);
					}
				});
		} else {
			res.send(["invalid"]);
		}
	});

	app.post("/addUser", (req, res) => {
		const addUser = req.body;
		const userEmail = req.body.CustomerEmail;
		const userPassword = req.body.CustomerPass;
		if (validator.validate(userEmail)) {
			userCollection.find({ CustomerEmail: userEmail })
				.toArray((err, documents) => {
					if (documents.length == 0) {
						bcrypt.hash(userPassword, saltRounds, function (err, hash) {
							addUser.CustomerPass = hash;
							userCollection.insertOne(addUser).then((result) => {
								res.send(result.insertedCount > 0);
							});
						});
					}
					else {
						res.send(false);
					}
				})


		} else {
			res.send(["invalid"]);
		}
	});

	app.post('/loginUser', (req, res) => {
		const loginUserEmail = req.body.loginEmail;
		const loginUserPassword = req.body.loginPassword;
		userCollection.find({ CustomerEmail: loginUserEmail })
			.toArray((err, documents) => {
				const userDetails = documents[0];
				if (documents.length !== 0) {
					bcrypt.compare(loginUserPassword, userDetails.CustomerPass, function (err, result) {
						userDetails.loginInfo = 'true';
						res.send(userDetails);
					});
				}
				else {
					res.send(false)
				}
			})
	})

	app.post('/loginAdmin', (req, res) => {
		const loginAdminEmail = req.body.loginEmail;
		const loginAdminPassword = req.body.loginPassword;
		adminCollection.find({ Email: loginAdminEmail })
			.toArray((err, documents) => {
				const adminDetails = documents[0];
				if (documents.length !== 0) {
					bcrypt.compare(loginAdminPassword, adminDetails.Password, function (err, result) {
						adminDetails.loginInfo = 'true';
						res.send(adminDetails);
					});
				}
				else {
					res.send(false)
				}
			})
	})



	app.post("/addProduct", (req, res) => {
		const addProduct = req.body;
		productCollection.insertOne(addProduct)
			.then((result) => {
				res.send(result.insertedCount > 0);
			});
	});

	app.post("/createOrder", (req, res) => {
		const orderDetails = req.body;
		orderCollection.insertOne(orderDetails)
			.then((result) => {
				res.send(result.insertedCount > 0);
			});
	});


// 	app.post("/clientOrder", (req, res) => {
// 		const orderDetails = req.body;
// 		userCollection
// 			.updateOne(
// 				{ CustomerEmail: req.body.CustomerEmail },
// 		{
// 			$set: {
// 				CustomerContact: req.body.CustomerContact,
// 				CustomerAddress: req.body.CustomerAddress,
// 			},
// 		}
// 	)
// });

app.get("/products/:First", (req, res) => {
	const key1 = req.params.First;

	productCollection
		.find({ ProductCategory: key1 })
		.toArray((err, documents) => {
			res.send(documents);
		});
});

app.get("/customerOrder/:id", (req, res) => {
	orderCollection
		.find({ CustomerEmail: req.params.id })
		.toArray((err, documents) => {
			res.send(documents);
		});
});
app.get("/products/:Second", (req, res) => {
	const key2 = req.params.Second;

	productCollection
		.find({ ProductCategory: key2 })
		.toArray((err, documents) => {
			res.send(documents);
		});
});

app.get("/products/:Third", (req, res) => {
	const key3 = req.params.Third;

	productCollection
		.find({ ProductCategory: key3 })
		.toArray((err, documents) => {
			res.send(documents);
		});
});

app.get("/category/:subName", (req, res) => {
	const abc = req.params.subName;
	productCollection
		.find({ ProductSubCategory: abc })
		.toArray((err, documents) => {
			res.send(documents);
		});
});

app.get("/product/:id", (req, res) => {
	productCollection
		.find({ _id: ObjectId(req.params.id) })
		.toArray((err, documents) => {
			res.send(documents);
		});
});

app.get("/search/:string", (req, res) => {
	const string = req.params.string;

	productCollection
		.find({ ProductName: new RegExp(string, "i") })
		.toArray((err, documents) => {
			res.send(documents);
		});
});

});


app.get("/", (req, res) => {
	res.send("Good Morning");
});
