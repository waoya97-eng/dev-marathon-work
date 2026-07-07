describe('顧客情報入力フォームのテスト', () => {
  it('顧客情報を入力して送信し、確認画面を経て登録が完了することを確認する', () => {
    cy.visit('/na_kondo/customer/add.html'); // テスト対象のページにアクセス

    cy.fixture('customerData').then((data) => {
      const uniqueContactNumber = `03-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
      cy.get('#companyName').type(data.companyName);
      cy.get('#industry').type(data.industry);
      cy.get('#contact').type(uniqueContactNumber);
      cy.get('#location').type(data.location);

      // フォーム送信 → 確認画面へ遷移
      cy.get('#customer-form').submit();
      cy.url().should('include', 'add-confirm.html');
      
      
      // 確認画面に入力内容が引き継がれているか確認
      cy.get('#companyName').should('have.text', data.companyName);
      cy.get('#industry').should('have.text', data.industry);
      cy.get('#contact').should('have.text', uniqueContactNumber);
      cy.get('#location').should('have.text', data.location);

      // ページ遷移後にalertをスタブ化(遷移前のスタブは引き継がれない)
      cy.window().then((win) => {
        cy.stub(win, 'alert').as('alertStub');
      });

      // 登録実行 → ここで初めてPOST /add-customerが発生する
      cy.get('#register-button').click();
      cy.get('@alertStub').should('have.been.calledOnceWith', '顧客情報が正常に保存されました。');
            // 登録後は一覧画面へ遷移する
      cy.url().should('include', 'list.html');
    });
  });
});

it('名前欄に100文字以上入力したらエラーメッセージが表示される', () => {
    cy.visit('/na_kondo/customer/add.html');

    // 1. 100文字（例えば「あ」を101文字分）の文字列を作って入力する
    const longName = 'あ'.repeat(101);
    cy.get('#name').type(longName); // ※#nameの部分は実際のHTMLの名前欄のidやclassに合わせてください

    // 2. 送信ボタンをクリックする
    cy.get('button[type="submit"]').click();

    // 3. エラーメッセージが表示されているか検証する
    // 例：画面内に「100文字以内で入力してください」というテキストが含まれているか
    cy.contains('100文字以内で入力してください').should('be.visible');
    
    // 4. 確認画面に遷移していないことも合わせてチェックするとより確実です
    cy.url().should('not.include', 'add-confirm.html');
  });
  
  it('電話番号欄にアルファベットを入力したらエラーメッセージが表示される', () => {
    // 1. 顧客追加画面を開く
    cy.visit('/na_kondo/customer/add.html');

    // 2. 電話番号欄にアルファベット（不正な値）を入力する
    cy.get('#tel').type('abcdef'); // ※#telの部分は実際のHTMLのidに合わせてください

    // 3. 送信ボタンをクリックする
    cy.get('button[type="submit"]').click();

    // 4. エラーメッセージが表示されているか検証する
    // 例：画面内に「半角数字で入力してください」などのテキストが含まれているか
    cy.contains('半角数字で入力してください').should('be.visible');
    
    // 5. 確認画面に進んでいないこともチェック
    cy.url().should('not.include', 'add-confirm.html');
  });
