const express = require("express");
const router = express.Router();
const { orders } = require("./store");
const {
    validateCreateOrder,
    normalizeItems,
    calculateTotal,
    makeOrderId,
    orderResponse
} = require("./service");

const DEFAULT_ORDER_STATUS = "created";

function validationProblem(message, details) {
    return { error: { code: "VALIDATION_ERROR", message, details } };
}

function notFoundProblem() {
    return { error: { code: "ORDER_NOT_FOUND", message: "Order not found" } };
}

router.post("/orders", (req, res, next) => {
    try {
        const validationErrors = validateCreateOrder(req.body);

        if (validationErrors.length > 0) {
            return res.status(400).json(validationProblem("Invalid order", validationErrors));
        }

        const items = normalizeItems(req.body.items);

        const newOrder = {
            id: makeOrderId(),
            customerName: req.body.customerName.trim(),
            items,
            total: calculateTotal(items),
            status: DEFAULT_ORDER_STATUS,
            createdAt: new Date().toISOString(),
        };

        orders.push(newOrder);

        return res
            .status(201)
            .location(`/orders/${newOrder.id}`)
            .json(orderResponse(newOrder));
    } catch (error) {
        return next(error);
    }
});

router.get("/orders", (req, res) => {
    const result = orders.map(orderResponse);
    res.status(200).json({ orders: result, count: result.length });
});

router.get("/orders/:id", (req, res, next) => {
    try {
        const matchingOrder = orders.find((order) => order.id === req.params.id);

        if (!matchingOrder) {
            return res.status(404).json(notFoundProblem());
        }

        return res.status(200).json(orderResponse(matchingOrder));
    } catch (error) {
        return next(error);
    }
});

router.delete("/orders/:id", (req, res, next) => {
    try {
        const orderIndex = orders.findIndex((order) => order.id === req.params.id);

        if (orderIndex === -1) {
            return res.status(404).json(notFoundProblem());
        }

        orders.splice(orderIndex, 1);
        return res.status(204).send();
    } catch (error) {
        return next(error);
    }
});

module.exports = router;