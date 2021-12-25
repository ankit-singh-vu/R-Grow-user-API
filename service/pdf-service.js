// const PDFDocument = require('pdfkit');
const { json } = require("express");
const PDFDocument = require("./pdfkit-tables");
const numWords = require('num-words')
function buildPDF(dataCallback, endCallback,data) {
  const doc = new PDFDocument({ bufferPages: true, font: 'Courier' });

  doc.on('data', dataCallback);
  doc.on('end', endCallback);
  doc.fontSize(20).text(`R-GROW INVOICE`,{ align: 'center'});

  doc.fontSize(9)
  doc.text('\n\n');

  // //customer info
  // doc.text('TO:');
  // doc.text(data.userId.name,{ align: 'right'});
  // // doc.text(data.userId.addressLine1);
  // // doc.text(data.userId.addressLine2);
  // doc.text(data.userId.phone,{ align: 'right'});
  // // doc.text(data.userId.country);
  // doc.text(data.userId.email);

  // //retailer info
  // doc.text('FROM:');
  // doc.text(data.retailerId.retailerName,{ align: 'right'});
  // doc.text(data.retailerId.addressLine1,{ align: 'right'});
  // doc.text(data.retailerId.addressLine2,{ align: 'right'});
  // doc.text(data.retailerId.state,{ align: 'right'});
  // doc.text(data.retailerId.country,{ align: 'right'});
  // doc.text(data.retailerId.phone,{ align: 'right'});
  // doc.text(data.retailerId.email,{ align: 'right'});

  // //Invoice info
  // doc.text('Invoice Info:');
  // doc.text(data.invoice_number,{ align: 'right'});
  // doc.text(data.orderIdForInv,{ align: 'right'});
  // doc.text(data.invoice_date,{ align: 'right'});  
  //--------------------------------------
  let from=
  " Name  : "+
  data.retailerId.retailerName+'\n'+
  " Address  : "+
  data.retailerId.addressLine1+' , '+
  // '\n'+
  data.retailerId.addressLine2+' , '+
  // '\n'+
  data.retailerId.state+' , '+data.retailerId.country+'\n'+
  " phone  : "+
  data.retailerId.phone+'\n'+
  " email  : "+
  data.retailerId.email;

  let to=
  " Name  : "+
  data.userId.name+'\n'+
  " Address  : "+
  data.userId.address.addressLine1+' , '+
  data.userId.address.addressLine2+' , '+
  data.userId.address.city+' , '+
  data.userId.address.state+' , '+
  data.userId.address.pincode+' , '+
  data.userId.address.country+'\n'+
  // // '\n'+
  // data.retailerId.addressLine2+' , '+
  " phone  : "+
  data.userId.phone;




  let invoice_info=
  " Invoice No. : "+
  data.invoice_number+'\n'+
  " Order No. : "+
  data.orderIdForInv+'\n'+
  " Invoice Date : "+
  data.invoice_date;


  let invoice_info_table = {
    headers: ["INVOICE DETAILS"],
    rows: [
        [invoice_info],
    ],
  };

  doc.table(invoice_info_table);
  doc.text('\n\n');  


  let fromto_table = {
    headers: [ "BILL TO (Customer) :","BILL FROM (Retailer): "],
    rows: [
        [to,from],
    ],
  };

  doc.table(fromto_table);
  doc.text('\n\n\n\n\n\n\n\n');


  let arry = [];
  for (let i = 0; i < data.orderId.orders.length; i++) {
    // doc.text(i);
 
    // arry.push([data.orderId.orders[i].product.productName,"aj"])
    arry.push([i+1,data.orderId.orders[i].product.productName,data.orderId.orders[i].product.hsnNumber,data.orderId.orders[i].quantity,'Rs.'+data.orderId.orders[i].selling_price,'Rs.'+data.orderId.orders[i].total_selling_price])
    //   // [
    //     // i+1,
    //     data.orderId.orders[i].product.productName
    //     // data.orderId.orders[i].quantity,
    //     // data.orderId.orders[i].total_selling_price
    //   // ]
    // );
  }
  arry.push([,,,,"cgst",'Rs.'+data.cgst])
  arry.push([,,,,"sgst",'Rs.'+data.sgst])
  arry.push([,,,,"igst",'Rs.'+data.igst])
  
  // console(JSON.stringify(arry))
  let items_table = {
    headers: ["S.NO", "ITEMS","HSN","QUANTITY","RATE","AMOUNT"],
    // rows: [
    //     ["ankit","riverside"],
    //     ["ankit","riverside"],
    //     arry
    // ],
    rows: arry,
  };
  doc.table(items_table);

   // Draw the table
    // doc.table(table, 10, 125, { width: 590 });
    // doc.table(table);

    let tot_table = {
      headers: ["Total", "","","",'Rs.'+data.total_amount],
      rows: [
      ],
    };
    doc.table(tot_table);
    let amt_words=numWords(data.total_amount);
    amt_words=capitalizeFirstLetter(amt_words)
    doc.text("Amount Chargeable (in words) : "+amt_words+' only.');

    // let tot_table_words = {
    //   headers: ["Amount Chargeable (in words)"],
    //   rows: [amt_words]
    // };
    // doc.table(tot_table_words);    
     // Draw the table
      // doc.table(table, 10, 125, { width: 590 });






  // for (let i = 0; i < data.orderId.orders.length; i++) {
  //   // doc.text(i);
  //   doc.text(data.orderId.orders[i].product.productName);
  //   doc.text(data.orderId.orders[i].quantity);    
  //   doc.text(data.orderId.orders[i].total_selling_price);    
  // }
  // doc.text(arry);

  doc.text("\n\n");
  doc.fontSize(7)

  doc.text('This is a Computer Generated Invoice',{ align: 'center'});

  doc.end();
}


function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
module.exports = { buildPDF };