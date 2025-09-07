insert into axis (name,weight) values
('Estratégia & Posicionamento',1),('Vendas & Aquisição',1),('Portfólio & Entrega',1),
('Operação & Sistemas',1),('Pessoas & Liderança',1),('Finanças',1),('IA & Automação',1),('Reforma Tributária',1)
on conflict do nothing;
insert into metric_type (name,unit,axis_name,min,max,up_better) values
('EBITDA %','%','Finanças',5,25,true),
('Receita por colaborador','R$','Finanças',8000,25000,true),
('Conversão proposta→fechamento','%','Vendas & Aquisição',15,45,true),
('NPS','pts','Portfólio & Entrega',30,80,true),
('Churn','%','Portfólio & Entrega',2,8,false),
('Leads por semana','#/semana','Vendas & Aquisição',3,12,true),
('Concentração Top-3','%','Finanças',20,50,false)
on conflict do nothing;
insert into config (id,green_min,yellow_min,w_subj,w_metr) values ('default',4,2.5,0.6,0.4)
on conflict (id) do nothing;
