import axios from "axios";
import {
  ORDER_CREATE_FAIL,
  ORDER_CREATE_REQUEST,
  ORDER_CREATE_SUCCESS,
  ORDER_DETAILS_REQUEST,
  ORDER_DETAILS_FAIL,
  ORDER_DETAILS_SUCCESS,
  ORDER_PAY_REQUEST,
  ORDER_PAY_SUCCESS,
  ORDER_PAY_FAIL,
  ORDER_MINE_LIST_REQUEST,
  ORDER_MINE_LIST_FAIL,
  ORDER_MINE_LIST_SUCCESS,
} from "../constants/orderConstants";
import { CART_EMPTY } from "../constants/cartConstants";

// use redux-thunk dispatch, getState methods
export const createOrder = (order) => async (dispatch, getState) => {
  try {
    //get userinfo from redux store using getState that returns the whole redux store
    const {
      userSignin: { userInfo },
    } = getState();
    const { data } = await axios.post("/api/orders", order, {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    });

    // console.log('userInfo', userInfo);
    const { fullName } = JSON.parse(localStorage.getItem("shippingAddress"));
    var options = {
      key: data.razorpayKey, // Enter the Key ID generated from the Dashboard
      amount: data.order.totalPrice * 100, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
      currency: "INR",
      order_id: data.razorpayId, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
      prefill: {
        name: fullName,
        // email: "gaurav.kumar@example.com",
        // contact: "9999999999",
      },
      handler: function (response) {
        dispatch({ type: CART_EMPTY });
        dispatch(payOrder({ _id: data.order._id }, { id: data.order._id }));
      },
    };
    const rzp1 = new window.Razorpay(options);
    rzp1.on("payment.failed", function (response) {
      alert("payment failed");
      console.log(response);
    });
    rzp1.open();

    // remove all items from shopping cart and clear local storage after clicking placeOrder button and receiving data from backend
  } catch (error) {
    // if error, dispatch FAIL, set payload to error message
    dispatch({
      type: ORDER_CREATE_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

// OrderDetail action
export const detailsOrder = (orderId) => async (dispatch, getState) => {
  dispatch({ type: ORDER_DETAILS_REQUEST, payload: orderId });
  //get userInfo from redux store
  const {
    userSignin: { userInfo },
  } = getState();

  try {
    //get the order-detail data from API request
    // need to send the optional header token info for the backend authorization
    const { data } = await axios.get(`/api/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    });
    // disptach the data
    dispatch({ type: ORDER_DETAILS_SUCCESS, payload: data });
  } catch (error) {
    // if error, dispatch FAIL, set payload to error message
    const message =
      error.response && error.response.data.message
        ? error.response.data.message
        : error.message;
    dispatch({ type: ORDER_DETAILS_FAIL, payload: message });
  }
};

//PayOrder action
export const payOrder =
  (order, paymentResult) => async (dispatch, getState) => {
    dispatch({ type: ORDER_PAY_REQUEST, payload: { order, paymentResult } });
    //get userInfo from redux store
    const {
      userSignin: { userInfo },
    } = getState();

    try {
      //get the order-detail data from API request
      // need to send the optional header token info for the backend authorization
      //updated order with payment result from paypal api
      const { data } = await axios.put(
        `/api/orders/${order._id}/pay`,
        paymentResult,
        {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        }
      );
      dispatch({ type: ORDER_CREATE_SUCCESS, payload: data.order });
      dispatch({ type: ORDER_PAY_SUCCESS });
      localStorage.removeItem("cartItems");
    } catch (error) {
      // if error, dispatch FAIL, set payload to error message
      const message =
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message;
      dispatch({ type: ORDER_PAY_FAIL, payload: message });
    }
  };

//Order History Related action
export const listOrderMine = () => async (dispatch, getState) => {
  dispatch({ type: ORDER_MINE_LIST_REQUEST });
  //get user info
  const {
    userSignin: { userInfo },
  } = getState();

  // console.log('userInfo:', userInfo);

  try {
    // send ajax request to get the user's orders
    const { data } = await axios.get("/api/orders/mine", {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    });
    dispatch({ type: ORDER_MINE_LIST_SUCCESS, payload: data });
  } catch (error) {
    // if error, dispatch FAIL, set payload to error message
    const message =
      error.response && error.response.data.message
        ? error.response.data.message
        : error.message;
    dispatch({ type: ORDER_MINE_LIST_FAIL, payload: message });
  }
};
