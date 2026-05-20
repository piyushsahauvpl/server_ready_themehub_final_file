import React, { useState } from "react";
import MainLayout from "../components/MainLayout";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  ListGroup,
  Badge,
} from "react-bootstrap";
import { FaSearch, FaPaperPlane, FaBook } from "react-icons/fa";

const articlesData = [
  {
    id: 1,
    title: "How to reset your password",
    category: "Account",
    description: "Steps to reset your account password securely.",
    link: "https://support.example.com/reset-password",
    keywords: ["password", "login", "reset"],
  },
  {
    id: 2,
    title: "How to create a new support ticket",
    category: "Tickets",
    description: "Learn how customers can raise a support ticket.",
    link: "https://support.example.com/create-ticket",
    keywords: ["ticket", "support", "issue"],
  },
  {
    id: 3,
    title: "Update profile information",
    category: "Account",
    description: "Guide to update name, email, and phone number.",
    link: "https://support.example.com/update-profile",
    keywords: ["profile", "account", "update"],
  },
];

function KnowledgeBase() {
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);

  const filteredArticles = articlesData.filter(
    (article) =>
      article.title.toLowerCase().includes(search.toLowerCase()) ||
      article.keywords.some((k) =>
        k.toLowerCase().includes(search.toLowerCase())
      )
  );

  return (
     <MainLayout>
    <Container fluid className="p-4 bg-light min-vh-100">
      <Row className="mb-4">
        <Col>
          <h3 className="fw-bold">
            <FaBook className="me-2 text-primary" />
            Knowledge Base
          </h3>
          <p className="text-muted">
            Search help articles and send them to customers
          </p>
        </Col>
      </Row>

      {/* Search Bar */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Search articles (password, ticket, profile...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>
        <Col md={2}>
          <Button className="w-100" variant="primary">
            <FaSearch className="me-2" />
            Search
          </Button>
        </Col>
      </Row>

      <Row>
        {/* Article List */}
        <Col md={7}>
          <Card className="shadow-sm">
            <Card.Header className="fw-semibold">
              Suggested Articles
            </Card.Header>

            <ListGroup variant="flush">
              {filteredArticles.length === 0 && (
                <ListGroup.Item className="text-muted">
                  No articles found
                </ListGroup.Item>
              )}

              {filteredArticles.map((article) => (
                <ListGroup.Item
                  key={article.id}
                  action
                  onClick={() => setSelectedArticle(article)}
                >
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className="mb-1">{article.title}</h6>
                      <small className="text-muted">
                        {article.description}
                      </small>
                    </div>
                    <Badge bg="secondary" className="align-self-start">
                      {article.category}
                    </Badge>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>

        {/* Article Details */}
        <Col md={5}>
          <Card className="shadow-sm">
            <Card.Header className="fw-semibold">
              Article Details
            </Card.Header>

            <Card.Body>
              {!selectedArticle ? (
                <p className="text-muted">
                  Select an article to view details
                </p>
              ) : (
                <>
                  <h5>{selectedArticle.title}</h5>
                  <p className="text-muted">
                    {selectedArticle.description}
                  </p>

                  <p>
                    <strong>Category:</strong>{" "}
                    {selectedArticle.category}
                  </p>

                  <Form.Group className="mb-3">
                    <Form.Label>Article Link</Form.Label>
                    <Form.Control
                      readOnly
                      value={selectedArticle.link}
                    />
                  </Form.Group>

                  <Button
                    variant="success"
                    className="w-100"
                    onClick={() =>
                      alert(
                        "Article link sent to customer:\n" +
                          selectedArticle.link
                      )
                    }
                  >
                    <FaPaperPlane className="me-2" />
                    Send Article to Customer
                  </Button>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
    </MainLayout>
  );
}

export default KnowledgeBase;
